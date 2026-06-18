export type OfferCategory = 'FOOD' | 'SHOPPING' | 'CULTURE' | 'TRAVEL' | 'WELLNESS' | 'OTHER';

// Offre partenaire (GET /api/offers, vitrine publique).
export type Offer = {
  id: string;
  partnerName: string;
  cost: number;
  discountPercent: number;
  category: OfferCategory;
  isActive: boolean;
  // Stock de codes promo (présent uniquement dans la liste admin).
  availableCodes?: number;
  usedCodes?: number;
  // Indicateur de dispo côté vitrine (≥1 code dispo), sans révéler le nombre.
  available?: boolean;
};
