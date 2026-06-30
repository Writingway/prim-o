import { prisma } from '../lib/db'
import { Prisma } from '@prisma/client'
import type { CreateOfferInput, UpdateOfferInput } from '../schemas/offer.schemas'
import { OFFERS_PUBLIC_PREFIX, removeUploadedFile } from '../lib/upload'

// Liste admin : chaque offre est enrichie du stock de codes promo
// (availableCodes = non utilisés, usedCodes = déjà distribués).
export const listOffers = async () => {
  const offers = await prisma.partnerOffer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, slug: true, label: true, icon: true, color: true } } },
  })

  // Comptage des codes par offre et par statut, en une seule requête.
  const grouped = await prisma.promoCode.groupBy({
    by: ['offerId', 'isUsed'],
    _count: { _all: true },
  })

  const counts = new Map<string, { availableCodes: number; usedCodes: number }>()
  for (const g of grouped) {
    const entry = counts.get(g.offerId) ?? { availableCodes: 0, usedCodes: 0 }
    if (g.isUsed) entry.usedCodes = g._count._all
    else entry.availableCodes = g._count._all
    counts.set(g.offerId, entry)
  }

  return offers.map((o) => ({
    ...o,
    availableCodes: counts.get(o.id)?.availableCodes ?? 0,
    usedCodes: counts.get(o.id)?.usedCodes ?? 0,
  }))
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

// Associe une photo (déjà écrite sur le disque par multer) à une offre.
// Supprime l'ancienne photo si l'offre en avait déjà une (best-effort).
export const setOfferImage = async (id: string, filename: string) => {
  const existing = await prisma.partnerOffer.findUnique({ where: { id }, select: { imageUrl: true } })
  if (!existing) throw new Error('OFFER_NOT_FOUND')
  const imageUrl = `${OFFERS_PUBLIC_PREFIX}/${filename}`
  const updated = await prisma.partnerOffer.update({ where: { id }, data: { imageUrl } })
  if (existing.imageUrl) await removeUploadedFile(existing.imageUrl)
  return updated
}

// Retire la photo d'une offre : supprime le fichier + remet imageUrl à null.
export const clearOfferImage = async (id: string) => {
  const existing = await prisma.partnerOffer.findUnique({ where: { id }, select: { imageUrl: true } })
  if (!existing) throw new Error('OFFER_NOT_FOUND')
  if (existing.imageUrl) await removeUploadedFile(existing.imageUrl)
  return prisma.partnerOffer.update({ where: { id }, data: { imageUrl: null } })
}

// Détail public d'une offre : uniquement active, + dispo (≥1 code) sans révéler le nombre.
export async function getActiveOffer(id: string) {
  const offer = await prisma.partnerOffer.findFirst({
    where: { id, isActive: true },
    select: { id: true, partnerName: true, cost: true, discountPercent: true, imageUrl: true, category: { select: { id: true, slug: true, label: true, icon: true, color: true } } },
  });
  if (!offer) return null;
  const stock = await prisma.promoCode.count({ where: { offerId: id, isUsed: false } });
  return { ...offer, available: stock > 0 };
}


// Offres partenaires actives (vitrine publique) + indicateur de dispo.
export async function listActiveOffers() {
  const offers = await prisma.partnerOffer.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      partnerName: true,
      cost: true,
      discountPercent: true,
      imageUrl: true,
      category: { select: { id: true, slug: true, label: true, icon: true, color: true } },
    },
  });

  // Offres ayant au moins un code disponible (on n'expose PAS le nombre exact).
  const withStock = await prisma.promoCode.groupBy({
    by: ['offerId'],
    where: { isUsed: false },
    _count: { _all: true },
  });
  const available = new Set(withStock.map((g) => g.offerId));

  return offers.map((o) => ({ ...o, available: available.has(o.id) }));
}