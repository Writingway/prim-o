import { prisma } from '../lib/db'
import { Prisma } from '@prisma/client'
import type { CreateOfferInput, UpdateOfferInput } from '../schemas/offer.schemas'

export const listOffers = async () => {
  return prisma.partnerOffer.findMany({ orderBy: { createdAt: 'desc' } })
}

export const getOffer = async (id: string) => {
  return prisma.partnerOffer.findUnique({ where: { id } })
}

export const createOffer = async (data: CreateOfferInput) => {
  return prisma.partnerOffer.create({ data })
}

export const updateOffer = async (id: string, data: UpdateOfferInput) => {
  return prisma.partnerOffer.update({ where: { id }, data: data as Prisma.PartnerOfferUpdateInput })
}

export const deactivateOffer = async (id: string) => {
  return prisma.partnerOffer.update({ where: { id }, data: { isActive: false } })
}

// Détail public d'une offre : uniquement active, mêmes champs que la vitrine.
export async function getActiveOffer(id: string) {
  return prisma.partnerOffer.findFirst({
    where: { id, isActive: true },
    select: { id: true, partnerName: true, cost: true, discountPercent: true, category: true },
  });
}


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