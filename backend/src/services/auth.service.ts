import bcrypt from "bcryptjs";
import {prisma} from "../lib/db";
import { signAccessToken, generateRefreshToken, REFRESH_TTL_MS, hashRefreshToken } from '../lib/token';
import type { LoginInput } from '../schemas/auth.schemas';
import type { RegisterManagerInput, RegisterUserInput } from "../schemas/auth.schemas";
import { Role } from "@prisma/client";

// 
export async function registerManager(input: RegisterManagerInput) {
  const { companyName, email, password } = input;

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
        role: Role.MANAGER,
        status: 'APPROVED',
        isEmailVerified: true,
        companyId: company.id
      }
    });
    return { company, user };
  });

  return { id: result.user.id, email: result.user.email, companyName: result.company.name }
};

export async function registerUser(input: RegisterUserInput) {
  const { firstName, lastName, email, password, code } = input;

  let companyId: string | null = null;
  if (code) {
    const rows = await prisma.$queryRaw<{ companyId: string }[]>`
      UPDATE "CompanyInviteCode"
      SET "usedCount" = "usedCount" + 1
      WHERE "code" = ${code}
        AND "revokedAt" IS NULL
        AND "expiresAt" > now()
        AND "usedCount" < "maxUses"
      RETURNING "companyId"
    `;
    const first = rows[0];
    if (!first) throw new Error('INVALID_CODE');
    companyId = first.companyId;
  }


  const existingEmployee = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existingEmployee) {
    throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      role: Role.EMPLOYEE,
      status: 'PENDING',
      isEmailVerified: false,
      companyId: companyId,
    },
  });


  // Crée le token email. Génère un raw + hash (réutilise generateRefreshToken() qui te rend { raw, hash }, ou ton propre helper)
  const { raw: emailToken, hash: emailTokenHash } = generateRefreshToken();

  const x = await prisma.emailVerificationToken.create({ 
    data: { 
      userId: user.id,
      tokenHash: emailTokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    } 
  });


  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status
  };
};

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

  // ROTATION atomique
  const { raw, hash } = generateRefreshToken();
  const newToken = await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        tokenHash: hash,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        userId: stored.userId,
      },
    });
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true, replacedById: created.id },
    });
    return created;
  });

  const userId = stored.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('INVALID_REFRESH');
  const accessToken = signAccessToken(userId, user.role, user.companyId ?? undefined);

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
