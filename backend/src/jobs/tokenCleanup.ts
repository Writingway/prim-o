import { prisma } from '../lib/db';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const EVERY_24H_MS = 24 * 60 * 60 * 1000;

// Purge : refresh expirés, refresh révoqués depuis plus de 30 jours
// (on GARDE les révoqués récents : la détection de vol par réutilisation
// a besoin de retrouver la ligne révoquée), et tokens email morts.
export async function purgeDeadTokens(): Promise<void> {
  const now = new Date();
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  const [refresh, email] = await prisma.$transaction([
    prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isRevoked: true, createdAt: { lt: cutoff } },
        ],
      },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
  ]);

  console.log(`[tokenCleanup] ${refresh.count} refresh + ${email.count} email supprimés`);
}

// Au boot puis toutes les 24h. deleteMany est idempotent : sans danger
// si plusieurs instances du serveur tournent en parallèle.
export function startTokenCleanup(): void {
  purgeDeadTokens().catch((err) => console.error('[tokenCleanup] échec :', err));
  const timer = setInterval(() => {
    purgeDeadTokens().catch((err) => console.error('[tokenCleanup] échec :', err));
  }, EVERY_24H_MS);
  timer.unref(); // n'empêche pas le process de s'arrêter proprement
}
