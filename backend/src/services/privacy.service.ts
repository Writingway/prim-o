import bcrypt from 'bcrypt'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/db';
import { generateRefreshToken } from '../lib/token';
import type { UpdateProfileInput } from '../schemas/privacy.schemas';

// ============================================================
//  RGPD — droit d'accès/portabilité (art. 15 & 20) + droit à
//  l'effacement (art. 17).
//  L'effacement = ANONYMISATION, pas suppression physique :
//  on conserve le registre comptable (Attribution / Redemption)
//  tout en détachant l'identité de la personne (considérant 26 :
//  les données anonymes sortent du champ du RGPD).
// ============================================================

// Export complet des données personnelles, format JSON portable.
// Ne renvoie JAMAIS passwordHash.

export async function exportUserData(userId: string) {
    const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            balance: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
            company: { select: { name: true } },
        },
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    const [attributionReceived, attributionSent, redemptions] = await Promise.all([
        prisma.attribution.findMany({
            where: { employeeId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                amount: true,
                reason: true,
                createdAt: true,
                manager: { select: { firstName: true, lastName: true } },
            },
        }),
        prisma.attribution.findMany({
            where: { managerId: userId},
            orderBy: { createdAt: 'desc'},
            select: {
                amount: true,
                reason: true,
                createdAt: true,
                employee: { select: { firstName: true, lastName: true } },
            },
        }),
        prisma.redemption.findMany({
            where: { employeeId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                amount: true,
                createdAt: true,
                offer: { select: { partnerName: true } },
                promoCode: { select: { code: true } },
            },
        }),
    ]);

    return {
        exportedAt: new Date().toISOString(),
        profile: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            balance: user.balance,
            isEmailVerified: user.isEmailVerified,
            companyName: user.company?.name ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
        attributionsReceived: attributionReceived.map((a) => ({
            amount: a.amount,
            reason: a.reason,
            createdAt: a.createdAt,
            managerName: `${a.manager.firstName ?? ''} ${a.manager.lastName ?? ''}`.trim(),
        })),
        attributionsSent: attributionSent.map((a) => ({
            amount: a.amount,
            reason: a.reason,
            createdAt: a.createdAt,
            employeeName: `${a.employee.firstName ?? ''} ${a.employee.lastName ?? ''}`.trim(),
        })),
        redemptions: redemptions.map((r) => ({
            amount: r.amount,
            createdAt: r.createdAt,
            offerName: r.offer.partnerName,
            promoCode: r.promoCode.code,
        })),
    };
}


// Anonymise un utilisateur DANS une transaction donnée (réutilisable
// par la suppression self-service ET par le soft delete manager).
//  - email : valeur unique non identifiante (l'uuid évite les collisions ;
//    deletedAt exclut la ligne de l'index partiel → réinscription possible)
//  - prénom / nom effacés
//  - passwordHash vidé → login impossible
//  - tokens d'accès supprimés (aucune valeur historique)
// On conserve role/companyId/balance : le ledger référence ce User.
export async function anonymizeUser(tx: Prisma.TransactionClient, userId: string): Promise<void> {
    await tx.user.update({
        where: { id: userId },
        data: {
            email: `deleted-${userId}@anonymized.local`,
            firstName: null,
            lastName: null,
            passwordHash: '',
            isEmailVerified: false,
            deletedAt: new Date(),
        },
    });

    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.emailVerificationToken.deleteMany({ where: { userId } });
}

// Rectification du profil (art. 16). Mise à jour partielle : on ne
// touche qu'aux champs fournis. Le changement d'email est le cas
// sensible (unicité + re-vérification).
export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Construit l'objet de mise à jour à partir des seuls champs fournis.
  const data: { firstName?: string; lastName?: string; email?: string; isEmailVerified?: boolean } = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;

  // Email : seulement s'il est fourni ET différent de l'actuel.
  let emailChanged = false;
  if (input.email !== undefined && input.email !== user.email) {
    const newEmail = input.email; // ici TS sait que c'est bien un string
    const taken = await prisma.user.findFirst({
      where: { email: newEmail, deletedAt: null, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw new Error('EMAIL_TAKEN');

    data.email = newEmail;
    data.isEmailVerified = false; // l'email change → doit être re-vérifié
    emailChanged = true;
  }

  // Transaction : mise à jour du profil + (si email changé) création du
  // token de re-vérification. L'envoi réel viendra avec Brevo.
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isEmailVerified: true,
      },
    });

    if (emailChanged) {
      const { hash } = generateRefreshToken();
      await tx.emailVerificationToken.create({
        data: { userId, tokenHash: hash, expiresAt: new Date(Date.now() + 86_400_000) },
      });
    }

    return u;
  });

  return updated;
}

// Suppression self-service : exige le mot de passe en confirmation
// d'une action irréversible.
export async function deleteOwnAccount(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error('INVALID_PASSWORD');
  }

  await prisma.$transaction(async (tx) => {
    await anonymizeUser(tx, userId);
  });
}
