import { prisma } from '../lib/db';

// L'employé échange ses tokens contre un code promo d'une offre.
// Atomique : réserve un code disponible, débite le solde, crée la redemption.
// Gère la concurrence (deux employés sur le dernier code) et la rupture de stock.
export async function redeemOffer(
  employeeId: string,
  companyId: string,
  offerId: string,
): Promise<{ redemptionId: string; code: string; offerName: string; amount: number }> {
  // L'offre doit exister et être active.
  const offer = await prisma.partnerOffer.findFirst({
    where: { id: offerId, isActive: true },
    select: { id: true, cost: true, partnerName: true },
  });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  // On tente plusieurs codes : si un autre employé en réserve un en même temps,
  // on réessaie avec le suivant (jusqu'à 5 collisions avant d'abandonner).
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await prisma.promoCode.findFirst({
      where: { offerId, isUsed: false },
      select: { id: true, code: true },
    });
    if (!candidate) throw new Error('OUT_OF_STOCK');

    try {
      return await prisma.$transaction(async (tx) => {
        // 1) Réserve le code de façon atomique (garde isUsed:false).
        const claim = await tx.promoCode.updateMany({
          where: { id: candidate.id, isUsed: false },
          data: { isUsed: true, usedAt: new Date() },
        });
        if (claim.count === 0) throw new Error('CODE_TAKEN'); // pris entre-temps → on réessaie

        // 2) Débite le solde de l'employé (garde balance >= cost).
        const debit = await tx.user.updateMany({
          where: { id: employeeId, balance: { gte: offer.cost } },
          data: { balance: { decrement: offer.cost } },
        });
        if (debit.count === 0) throw new Error('INSUFFICIENT_BALANCE'); // rollback → code libéré

        // 3) Trace la redemption (snapshot du coût).
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
      if (err instanceof Error && err.message === 'CODE_TAKEN') continue; // autre code
      throw err;
    }
  }
  // Trop de collisions consécutives → on considère qu'il n'y a plus de stock dispo.
  throw new Error('OUT_OF_STOCK');
}
