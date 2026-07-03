import bcrypt from "bcrypt";
import { prisma } from "../lib/db";
import {
  signAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  REFRESH_TTL_MS,
  hashRefreshToken
} from '../lib/token';
import type {
  LoginInput,
  RegisterInput,
  CreateCompanyInput,
  JoinCompanyInput
} from '../schemas/auth.schemas';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mail';
import { Role } from "@prisma/client";
import { DomainError, ErrorCode } from "../middleware/error.middleware";

// Issues a session: a persisted refresh token plus a signed access token.
async function issueSession(user: { id: string; role: Role | null; companyId: string | null }) {
  const { raw: refreshToken, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  const accessToken = signAccessToken(user.id, user.role, user.companyId ?? undefined);
  return { accessToken, refreshToken };
}

// Account-first signup: creates a floating user (role null, companyId null);
// company membership comes later.
export async function register(input: RegisterInput) {
  const { firstName, lastName, email, password } = input;

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) throw new DomainError(ErrorCode.EMAIL_TAKEN);

  const passwordHash = await bcrypt.hash(password, 12);
  const { raw, hash } = generateEmailVerificationToken();

  // Atomic: never create an account without its email-verification token.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, firstName, lastName, role: null, companyId: null },
    });
    await tx.emailVerificationToken.create({
      data: { userId: created.id, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) },
    });
    return created;
  });

  // Outside the transaction: a failed email send must not roll back the signup.
  await sendVerificationEmail(user.email, raw);

  // No auto-login: the user must verify their email before signing in.
  return { email: user.email };
}

// A floating user creates their company (PENDING) and becomes OWNER.
// A fresh access token is issued: the old one still carried role=null.
export async function createCompany(userId: string, input: CreateCompanyInput) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new DomainError(ErrorCode.USER_NOT_FOUND);
  if (user.companyId !== null) throw new DomainError(ErrorCode.ALREADY_IN_COMPANY);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: input.companyName } });
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { role: Role.OWNER, companyId: company.id },
    });
    return { company, user: updatedUser };
  });

  const accessToken = signAccessToken(
    result.user.id, result.user.role, result.user.companyId ?? undefined
  );
  return {
    company: { id: result.company.id, name: result.company.name, status: result.company.status },
    accessToken,
  };
}

// A floating user joins a company via an invite code. A valid code makes them an
// active member immediately - no manager approval step (spec §4).
export async function joinCompany(userId: string, input: JoinCompanyInput) {
  const { code } = input;
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new DomainError(ErrorCode.USER_NOT_FOUND);
  if (user.companyId !== null) throw new DomainError(ErrorCode.ALREADY_IN_COMPANY);

  const updatedUser = await prisma.$transaction(async (tx) => {
    // Atomic code consumption: if usedCount is at the cap, only one concurrent caller wins.
    const rows = await tx.$queryRaw<{ companyId: string; role: Role }[]>`
      UPDATE "CompanyInviteCode"
      SET "usedCount" = "usedCount" + 1
      WHERE "code" = ${code} AND "revokedAt" IS NULL
        AND "expiresAt" > now() AND "usedCount" < "maxUses"
      RETURNING "companyId", "role"`;
    if (!rows[0]) throw new DomainError(ErrorCode.INVALID_CODE);

    return tx.user.update({
      where: { id: userId },
      data: { role: rows[0].role, companyId: rows[0].companyId },
    });
  });

  const accessToken = signAccessToken(
    updatedUser.id, updatedUser.role, updatedUser.companyId ?? undefined
  );
  return { accessToken };
}


export async function refreshTokens(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new DomainError(ErrorCode.INVALID_REFRESH);

  // THEFT DETECTION: a revoked token being reused kills every session of the user.
  if (stored.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, isRevoked: false },
      data: { isRevoked: true },
    });
    throw new DomainError(ErrorCode.INVALID_REFRESH);
  }

  if (stored.expiresAt < new Date()) throw new DomainError(ErrorCode.INVALID_REFRESH);

  // Deleted user: reject BEFORE minting any new token.
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.deletedAt !== null) {
    throw new DomainError(ErrorCode.INVALID_REFRESH);
  }

  // ROTATION: the revocation is guarded on isRevoked: false. Two concurrent
  // refreshes → only one wins; the other matches zero rows, throws, rolls back.
  const { raw, hash } = generateRefreshToken();
  await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: { tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS), userId: stored.userId },
    });
    const revoked = await tx.refreshToken.updateMany({
      where: { id: stored.id, isRevoked: false },
      data: { isRevoked: true, replacedById: created.id },
    });
    if (revoked.count === 0) throw new DomainError(ErrorCode.INVALID_REFRESH);
  });

  const accessToken = signAccessToken(user.id, user.role, user.companyId ?? undefined);
  return { accessToken, refreshToken: raw };
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) throw new DomainError(ErrorCode.INVALID_CREDENTIALS);

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) throw new DomainError(ErrorCode.INVALID_CREDENTIALS);

  // Floating users (companyId null, role null) CAN log in. Company capabilities
  // are gated further down the stack on Company.status.
  if (!user.isEmailVerified) throw new DomainError(ErrorCode.EMAIL_NOT_VERIFIED);

  // GDPR: record the last login; the inactive-account anonymization job relies on it.
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return issueSession(user);
}

// Single source of identity for the frontend: role + company + status.
// Read from DB - the token may be stale and does not carry company.status.
export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, companyId: true, profilePhoto: true,
      company: { select: { id: true, name: true, status: true } },
    },
  });
  if (!user) throw new DomainError(ErrorCode.USER_NOT_FOUND);
  return user;
}

export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, isRevoked: false },
    data: { isRevoked: true },
  });
}

// Consumes an email-verification token from the emailed link. Atomic: the token
// is marked used only if it was not already, so it cannot be consumed twice.
export async function verifyEmail(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new DomainError(ErrorCode.INVALID_TOKEN);
  if (stored.usedAt !== null) throw new DomainError(ErrorCode.INVALID_TOKEN);
  if (stored.expiresAt < new Date()) throw new DomainError(ErrorCode.INVALID_TOKEN);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.emailVerificationToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (consumed.count === 0) throw new DomainError(ErrorCode.INVALID_TOKEN);

    await tx.user.update({
      where: { id: stored.userId },
      data: { isEmailVerified: true },
    });
  });
}

// Resends a verification email. Silent by design: never reveals whether the email
// exists or is already verified (the controller answers identically in every case).
// Older links are invalidated so only one stays active.
export async function resendVerification(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null, isEmailVerified: false },
    select: { id: true, email: true },
  });
  if (!user) return; // Unknown or already verified: do nothing.

  const { raw, hash } = generateEmailVerificationToken();
  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) },
    });
  });

  await sendVerificationEmail(user.email, raw);
}

// Forgotten password: issues a reset token (1h TTL) and emails the link.
// Silent by design (anti-enumeration): the controller answers identically whether
// the email exists or not. Older links are invalidated (only one active at a time).
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true },
  });
  if (!user) return;

  const { raw, hash } = generatePasswordResetToken();
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 3_600_000) },
    });
  });

  await sendPasswordResetEmail(user.email, raw);
}

// Consumes a reset token and sets the new password. Atomic, and REVOKES ALL of
// the user's refresh sessions: changing the password logs out everywhere
// (defense for a compromised account).
export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new DomainError(ErrorCode.INVALID_TOKEN);
  if (stored.usedAt !== null) throw new DomainError(ErrorCode.INVALID_TOKEN);
  if (stored.expiresAt < new Date()) throw new DomainError(ErrorCode.INVALID_TOKEN);

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (consumed.count === 0) throw new DomainError(ErrorCode.INVALID_TOKEN);

    await tx.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    });

    await tx.refreshToken.updateMany({
      where: { userId: stored.userId, isRevoked: false },
      data: { isRevoked: true },
    });
  });
}
