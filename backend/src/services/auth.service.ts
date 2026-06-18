import bcrypt from "bcrypt";
import { prisma } from "../lib/db";
import {
  signAccessToken,
  generateRefreshToken,
  REFRESH_TTL_MS,
  hashRefreshToken
} from '../lib/token';
import type {
  LoginInput,
  RegisterInput,
  CreateCompanyInput,
  JoinCompanyInput
} from '../schemas/auth.schemas';
import { Role } from "@prisma/client";
import { DomainError, ErrorCode } from "../middleware/error.middleware";

// Émet un refresh token (stocké) + un access token pour un utilisateur donné.
async function issueSession(user: { id: string; role: Role | null; companyId: string | null }) {
  const { raw: refreshToken, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  const accessToken = signAccessToken(user.id, user.role, user.companyId ?? undefined);
  return { accessToken, refreshToken };
}

// Account-first : crée un utilisateur flottant (role null, companyId null),
// connecté immédiatement. L'appartenance entreprise vient ensuite.
export async function register(input: RegisterInput) {
  const { firstName, lastName, email, password } = input;

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) throw new DomainError(ErrorCode.EMAIL_TAKEN);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, role: null, companyId: null },
  });

  return issueSession(user);
}

// L'utilisateur flottant crée son entreprise (PENDING) et devient OWNER.
// On ré-émet un accessToken frais : l'ancien portait role=null.
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

// L'utilisateur flottant rejoint une entreprise via code d'invitation.
// Code valide = membre actif direct (plus d'approbation manager — spec §4).
export async function joinCompany(userId: string, input: JoinCompanyInput) {
  const { code } = input;
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new DomainError(ErrorCode.USER_NOT_FOUND);
  if (user.companyId !== null) throw new DomainError(ErrorCode.ALREADY_IN_COMPANY);

  const updatedUser = await prisma.$transaction(async (tx) => {
    // Consommation atomique du code : un seul gagnant si usedCount au plafond.
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

  // DÉTECTION DE VOL : token révoqué réutilisé = on coupe toutes les sessions.
  if (stored.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, isRevoked: false },
      data: { isRevoked: true },
    });
    throw new DomainError(ErrorCode.INVALID_REFRESH);
  }

  if (stored.expiresAt < new Date()) throw new DomainError(ErrorCode.INVALID_REFRESH);

  // Utilisateur supprimé : on rejette AVANT de créer le moindre token.
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.deletedAt !== null) {
    throw new DomainError(ErrorCode.INVALID_REFRESH);
  }

  // ROTATION : révocation conditionnelle (isRevoked: false). Deux refresh
  // simultanés → un seul gagne ; l'autre matche 0 ligne, throw, rollback.
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

  // Les utilisateurs flottants (companyId null, role null) PEUVENT se connecter.
  // La capacité entreprise est gardée plus loin sur Company.status.
  if (!user.isEmailVerified) throw new DomainError(ErrorCode.EMAIL_NOT_VERIFIED);

  return issueSession(user);
}

// Source unique d'identité pour le frontend : rôle + entreprise + statut.
// Lu en DB — le token peut être périmé et ne porte pas company.status.
export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, companyId: true,
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
