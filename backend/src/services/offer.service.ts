import { prisma } from "../lib/db";

// Offres partenaires actives (vitrine publique).
export async function listActiveOffers() {
  return prisma.partnerOffer.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      partnerName: true,
      cost: true,
      discountPercent: true,
      category: true,
    },
  });
}
