import crypto from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/db';

// Alphabet without ambiguous characters (0/O, 1/I/L) for reliable human entry.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 symbols.
const CODE_LENGTH = 12;                                   // ~59 bits of entropy.
const MAX_COLLISION_RETRIES = 5;

// Cryptographically random code. Rejection sampling: bytes outside the largest
// range divisible by the alphabet size are discarded to avoid modulo bias.
function generateCode(): string {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let out = '';
  while (out.length < CODE_LENGTH) {
    const byte = crypto.randomBytes(1)[0]!;
    if (byte < limit) {
      out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
  }
  return out;
}

// Creates an invite code for the caller's company.
// companyId and createdById come from the token (controller side), never from the client.
export async function generateInviteCode(params: {
  companyId: string;
  role: Role;
  createdById: string;
  maxUses: number;
  expiresInHours: number;
}) {
  const { companyId, role, createdById, maxUses, expiresInHours } = params;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { status: true } });
  if (!company || company.status !== 'APPROVED') {
    throw new Error('COMPANY_INACTIVE');
  }

  // Retry on @unique "code" collisions (vanishingly rare at ~59 bits).
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = generateCode();    
    try {
      return await prisma.companyInviteCode.create({
        data: { code, companyId, role, createdById, maxUses, expiresAt },
        select: { code: true, maxUses: true, expiresAt: true, createdAt: true},
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        continue; // Collision: regenerate.
      }
      throw err;
    }
  }

  throw new Error('CODE_GENERATION_FAILED');
}
