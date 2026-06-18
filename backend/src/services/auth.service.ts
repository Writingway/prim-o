import bcrypt from "bcrypt";
import {prisma} from "../lib/db";
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
  RegisterCompanyInput,
  RegisterUserInput 
} from '../schemas/auth.schemas';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mail';
import { Role } from "@prisma/client";


export async function registerCompany(input: RegisterCompanyInput) {
  const { companyName, firstName, lastName, email, password } = input;

  const existingManager = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existingManager) {
    throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { raw, hash } = generateEmailVerificationToken();

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: companyName } });
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: Role.OWNER,
        status: 'APPROVED',      // l'OWNER n'a personne pour l'approuver → actif d'emblée (la capacité entreprise reste gardée par Company.status)
        isEmailVerified: false,  // vérification par lien (Brevo)
        companyId: company.id,
      },
    });
    await tx.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) },
    });
    return { company, user };
  });

  // Hors transaction : un échec d'envoi ne doit pas annuler l'inscription.
  await sendVerificationEmail(result.user.email, raw);

  return { id: result.user.id, email: result.user.email, companyName: result.company.name };
}



export async function registerUser(input: RegisterUserInput) {
  const { firstName, lastName, email, password, code } = input;
  const passwordHash = await bcrypt.hash(password, 12); // outside tx: slow

  const { user, raw } = await prisma.$transaction(async (tx) => {
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

    const { raw, hash } = generateEmailVerificationToken();
    await tx.emailVerificationToken.create({ data: { userId: user.id,
      tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) } });

    return { user, raw };
  });

  await sendVerificationEmail(user.email, raw);

  return { id: user.id, firstName, lastName, email, status: user.status };
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

// Consomme un token de vérification email reçu par lien. Atomique :
// on ne marque utilisé que si ça ne l'est pas déjà (pas de double usage).
export async function verifyEmail(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new Error('INVALID_VERIFICATION');
  if (stored.usedAt !== null) throw new Error('INVALID_VERIFICATION');
  if (stored.expiresAt < new Date()) throw new Error('INVALID_VERIFICATION');

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.emailVerificationToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (consumed.count === 0) throw new Error('INVALID_VERIFICATION');

    await tx.user.update({
      where: { id: stored.userId },
      data: { isEmailVerified: true },
    });
  });
}

// Renvoie un email de vérification. Silencieux par conception : ne révèle
// jamais si l'email existe ou est déjà vérifié (le controller répond pareil
// dans tous les cas). Invalide les anciens liens pour n'en garder qu'un actif.
export async function resendVerification(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null, isEmailVerified: false },
    select: { id: true, email: true },
  });
  if (!user) return; // inexistant OU déjà vérifié → on ne fait rien

  const { raw, hash } = generateEmailVerificationToken();
  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) },
    });
  });

  await sendVerificationEmail(user.email, raw);
}

// Mot de passe oublié : génère un token de reset (TTL 1h) et envoie le lien.
// Silencieux par conception (anti-énumération) : le controller répond pareil
// que l'email existe ou non. Invalide les anciens liens (un seul actif).
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

// Consomme un token de reset et change le mot de passe. Atomique, et
// RÉVOQUE TOUTES LES SESSIONS (refresh) de l'user : changer son mot de
// passe déconnecte partout (défense contre un compte compromis).
export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new Error('INVALID_RESET');
  if (stored.usedAt !== null) throw new Error('INVALID_RESET');
  if (stored.expiresAt < new Date()) throw new Error('INVALID_RESET');

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (consumed.count === 0) throw new Error('INVALID_RESET');

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
