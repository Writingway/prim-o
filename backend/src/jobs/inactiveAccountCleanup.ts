import { prisma } from '../lib/db';
import { anonymizeUser } from '../services/privacy.service';

const EVERY_24H_MS = 24 * 60 * 60 * 1000;
const INACTIVITY_YEARS = 3;

export async function anonymizeInactiveAccounts(): Promise<void> {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - INACTIVITY_YEARS);

    const candidates = await prisma.user.findMany({
        where: {
            deletedAt: null,
            role: { not: 'ADMIN'},
            OR: [
                { lastLoginAt: { lt: cutoff } },
                {lastLoginAt: null, createdAt: { lt: cutoff} },
            ],
        },
        select: { id: true},
    });

    for (const { id } of candidates) {
        await prisma.$transaction((tx) => anonymizeUser(tx, id));
    }

    console.log(`[inactiveCleanup] ${candidates.length} compte(s) inactif(s) anonymisé(s)`);
}

export function startInactiveAccountCleanup(): void {
    anonymizeInactiveAccounts().catch((err) => console.error('[inactiveCleanup] échec :', err));
    const timer = setInterval(() => {
        anonymizeInactiveAccounts().catch((err) => console.error('[inactiveCleanup] échec :', err));
    }, EVERY_24H_MS);
    timer.unref(); // n'empêche pas l'arrêt propre du process
}