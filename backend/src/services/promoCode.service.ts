import { prisma } from '../lib/db';

// Ajoute en lot des codes promo à une offre.
// Nettoie (trim + retire les vides), dédoublonne le lot, et ignore les codes
// déjà présents en base (contrainte @unique) via skipDuplicates.
// Renvoie un compte-rendu { added, skipped }.
export async function addPromoCodes(
  offerId: string,
  codes: string[],
): Promise<{ added: number; skipped: number }> {
  // 1) L'offre doit exister.
  const offer = await prisma.partnerOffer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  // 2) Nettoyage + dédoublonnage du lot collé.
  const unique = [...new Set(codes.map((c) => c.trim()).filter((c) => c.length > 0))];
  if (unique.length === 0) return { added: 0, skipped: 0 };

  // 3) Insertion en masse ; les codes déjà en base sont sautés silencieusement.
  const result = await prisma.promoCode.createMany({
    data: unique.map((code) => ({ code, offerId })),
    skipDuplicates: true,
  });

  // 4) Compte-rendu : créés vs ignorés (déjà existants).
  return { added: result.count, skipped: unique.length - result.count };
}

// Liste les codes d'une offre (dispo d'abord, puis utilisés). Lecture admin.
export async function listPromoCodes(offerId: string) {
  const offer = await prisma.partnerOffer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  return prisma.promoCode.findMany({
    where: { offerId },
    orderBy: [{ isUsed: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, code: true, isUsed: true, usedAt: true },
  });
}
