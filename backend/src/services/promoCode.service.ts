import { prisma } from '../lib/db';

// Bulk-adds promo codes to an offer: trims, drops empties, dedupes the pasted
// batch, and skips codes already in DB (@unique) via skipDuplicates.
export async function addPromoCodes(
  offerId: string,
  codes: string[],
): Promise<{ added: number; skipped: number }> {
  const offer = await prisma.partnerOffer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  const unique = [...new Set(codes.map((c) => c.trim()).filter((c) => c.length > 0))];
  if (unique.length === 0) return { added: 0, skipped: 0 };

  const result = await prisma.promoCode.createMany({
    data: unique.map((code) => ({ code, offerId })),
    skipDuplicates: true,
  });

  return { added: result.count, skipped: unique.length - result.count };
}

// Deletes a promo code ONLY while it is still unused. The guarded deleteMany
// (isUsed: false) can never remove a code an employee just claimed — that would
// break their redemption.
export async function deletePromoCode(codeId: string): Promise<void> {
  const result = await prisma.promoCode.deleteMany({
    where: { id: codeId, isUsed: false },
  });
  if (result.count === 0) {
    // Zero rows deleted: either the code does not exist or it is already used.
    const existing = await prisma.promoCode.findUnique({
      where: { id: codeId },
      select: { isUsed: true },
    });
    if (!existing) throw new Error('CODE_NOT_FOUND');
    throw new Error('CODE_USED');
  }
}

// Admin-only listing of an offer's codes, available first.
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
