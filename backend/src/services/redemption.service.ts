import { prisma } from '../lib/db';

// An employee redeems tokens for one of an offer's promo codes.
// Atomic: reserve an available code, debit the balance, record the redemption.
// Handles concurrency (two employees racing for the last code) and out-of-stock.
export async function redeemOffer(
  employeeId: string,
  companyId: string,
  offerId: string,
): Promise<{ redemptionId: string; code: string; offerName: string; amount: number }> {
  const offer = await prisma.partnerOffer.findFirst({
    where: { id: offerId, isActive: true },
    select: { id: true, cost: true, partnerName: true },
  });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  // Try candidate codes one at a time: if another employee reserves ours concurrently,
  // retry with the next one (give up after 5 collisions).
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await prisma.promoCode.findFirst({
      where: { offerId, isUsed: false },
      select: { id: true, code: true },
    });
    if (!candidate) throw new Error('OUT_OF_STOCK');

    try {
      return await prisma.$transaction(async (tx) => {
        // Reserve the code atomically (guarded on isUsed: false).
        const claim = await tx.promoCode.updateMany({
          where: { id: candidate.id, isUsed: false },
          data: { isUsed: true, usedAt: new Date() },
        });
        if (claim.count === 0) throw new Error('CODE_TAKEN'); // Claimed meanwhile: retry.

        // Debit the employee's balance (guarded on balance >= cost).
        const debit = await tx.user.updateMany({
          where: { id: employeeId, balance: { gte: offer.cost } },
          data: { balance: { decrement: offer.cost } },
        });
        if (debit.count === 0) throw new Error('INSUFFICIENT_BALANCE'); // Rollback frees the code.

        // Record the redemption with a snapshot of the cost.
        const redemption = await tx.redemption.create({
          data: {
            amount: offer.cost,
            employeeId,
            offerId,
            promoCodeId: candidate.id,
            companyId,
          },
          select: { id: true },
        });

        return {
          redemptionId: redemption.id,
          code: candidate.code,
          offerName: offer.partnerName,
          amount: offer.cost,
        };
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'CODE_TAKEN') continue; // Try the next code.
      throw err;
    }
  }
  // Too many consecutive collisions: treat as out of stock.
  throw new Error('OUT_OF_STOCK');
}
