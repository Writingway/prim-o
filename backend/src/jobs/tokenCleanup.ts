import { prisma } from '../lib/db';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const EVERY_24H_MS = 24 * 60 * 60 * 1000;

// Purge expired refresh tokens, refresh tokens revoked more than 30 days ago, and dead email
// tokens. Recently revoked refresh tokens are KEPT on purpose: theft detection by reuse needs
// to find the revoked row.
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

// Runs at boot, then every 24h. deleteMany is idempotent, so concurrent server instances are
// harmless.
export function startTokenCleanup(): void {
  purgeDeadTokens().catch((err) => console.error('[tokenCleanup] échec :', err));
  const timer = setInterval(() => {
    purgeDeadTokens().catch((err) => console.error('[tokenCleanup] échec :', err));
  }, EVERY_24H_MS);
  timer.unref(); // don't keep the process alive for this timer
}
