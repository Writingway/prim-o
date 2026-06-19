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
  const { raw, hash } = generateEmailVerificationToken();

  // Atomique : jamais de compte sans son token de vérification.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, firstName, lastName, role: null, companyId: null },
    });
    await tx.emailVerificationToken.create({
      data: { userId: created.id, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) },
    });
    return created;
  });

  // Hors transaction : un échec d'envoi ne doit pas annuler l'inscription.
  await sendVerificationEmail(user.email, raw);

  // Pas d'auto-login : l'utilisateur doit vérifier son email avant de se connecter.
  return { email: user.email };
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

  // RGPD : trace la dernière connexion (le job d'anonymisation des comptes inactifs s'en sert).
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

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

// Consomme un token de vérification email reçu par lien. Atomique :
// on ne marque utilisé que si ça ne l'est pas déjà (pas de double usage).
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
