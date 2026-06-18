import crypto from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/db';

// Alphabet sans caractères ambigus (0/O, 1/I/L) pour une saisie humaine fiable.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 symboles
const CODE_LENGTH = 12;                                   // ~59 bits d'entropie
const MAX_COLLISION_RETRIES = 5;

// Génère un code cryptographiquement aléatoire.
// Rejection sampling : on jette les octets hors de la plage divisible
// par la taille de l'alphabet pour éviter tout biais modulo.
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

// Crée un code d'invitation pour l'entreprise du manager.
// companyId et createdById viennent du token (controller), jamais du client.
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

  // Retry sur collision du @unique "code" (extrêmement rare avec 59 bits).
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = generateCode();    
    try {
      return await prisma.companyInviteCode.create({
        data: { code, companyId, role, createdById, maxUses, expiresAt },
        select: { code: true, maxUses: true, expiresAt: true, createdAt: true},
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        continue; // collision : on regénère
      }
      throw err;
    }
  }

  throw new Error('CODE_GENERATION_FAILED');
}
