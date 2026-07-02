import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across dev hot reloads; a fresh client per reload would leak
// database connections.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
