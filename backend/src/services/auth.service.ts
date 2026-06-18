import bcrypt from "bcrypt";
import {prisma} from "../lib/db";
import {
  signAccessToken, 
  generateRefreshToken, 
  REFRESH_TTL_MS, 
  hashRefreshToken 
} from '../lib/token';
import type { 
  LoginInput, 
  RegisterCompanyInput,
  RegisterUserInput 
} from '../schemas/auth.schemas';
import { Role } from "@prisma/client";


export async function registerCompany(input: RegisterCompanyInput) {
  const { companyName, firstName, lastName, email, password } = input;

  const existingManager = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existingManager) {
    throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: companyName } });
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: Role.OWNER,
        isEmailVerified: true, // Dette Technique TODO: should be false and send email verification
        companyId: company.id
      }
    });
    return { company, user };
  });

  return { id: result.user.id, email: result.user.email, companyName: result.company.name }
};


export async function registerUser(input: RegisterUserInput) {
  const { firstName, lastName, email, password, code } = input;
  const passwordHash = await bcrypt.hash(password, 12); // outside tx: slow

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({ where: { email, deletedAt: null } });
    if (existing) throw new Error('EMAIL_TAKEN');

    const rows = await tx.$queryRaw<{ companyId: string, role: Role }[]>`
      UPDATE "CompanyInviteCode"
      SET "usedCount" = "usedCount" + 1
      WHERE "code" = ${code} AND "revokedAt" IS NULL
        AND "expiresAt" > now() AND "usedCount" < "maxUses"
      RETURNING "companyId", "role"`;
    if (!rows[0]) throw new Error('INVALID_CODE');

    const user = await tx.user.create({ data: { firstName, lastName, email,
      passwordHash, role: rows[0].role, status: 'PENDING',
      isEmailVerified: false, companyId: rows[0].companyId } });

    const { hash } = generateRefreshToken();
    await tx.emailVerificationToken.create({ data: { userId: user.id,
      tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) } });

    return { id: user.id, firstName, lastName, email, status: user.status };
  });
}

export async function refreshTokens(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new Error('INVALID_REFRESH');

  // DÉTECTION DE VOL : token révoqué = quelqu'un réutilise un vieux token
  if (stored.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, isRevoked: false },
      data: { isRevoked: true },
    });
    throw new Error('INVALID_REFRESH');
  }

  if (stored.expiresAt < new Date()) throw new Error('INVALID_REFRESH');

  // Utilisateur supprimé / non approuvé : on rejette AVANT de créer
  // le moindre token (ton ancien check était après la rotation →
  // chaque appel d'un user supprimé créait une ligne orpheline).
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.deletedAt !== null || user.status !== 'APPROVED') {
    throw new Error('INVALID_REFRESH');
  }

  // ROTATION : la révocation est CONDITIONNELLE (isRevoked: false).
  // Deux refresh simultanés (deux onglets) → un seul gagne ; l'autre
  // matche 0 ligne, throw, et sa création est annulée par le rollback.
  const { raw, hash } = generateRefreshToken();
  await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        tokenHash: hash,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        userId: stored.userId,
      },
    });
    const revoked = await tx.refreshToken.updateMany({
      where: { id: stored.id, isRevoked: false },
      data: { isRevoked: true, replacedById: created.id },
    });
    if (revoked.count === 0) throw new Error('INVALID_REFRESH');
  });

  const accessToken = signAccessToken(user.id, user.role, user.companyId ?? undefined);
  return { accessToken, refreshToken: raw };
}


export async function login(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error('INVALID_CREDENTIALS');
  }
  if (user.companyId === null && user.role !== Role.ADMIN) {
    throw new Error('INVALID_CREDENTIALS');
  }
  if (user.status !== 'APPROVED') {
    throw new Error('USER_NOT_APPROVED');
  }
  if (!user.isEmailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken(user.id, user.role, user.companyId ?? undefined);
  return { accessToken, refreshToken };
}

export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, isRevoked: false },
    data: { isRevoked: true },
  });
}