export type OfferCategory = 'FOOD' | 'SHOPPING' | 'CULTURE' | 'TRAVEL' | 'WELLNESS' | 'OTHER';

// Offre partenaire (GET /api/offers, vitrine publique).
export type Offer = {
  id: string;
  partnerName: string;
  cost: number;
  discountPercent: number;
  category: OfferCategory;
  isActive: boolean;
};
