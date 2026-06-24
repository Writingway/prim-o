export type Category = {
  id: string;
  slug: string;
  label: string;
  icon: string;       // IconName value from the icon set
  color: string;      // hex color e.g. "#e5784a"
  sortOrder?: number;
  isActive?: boolean;
};

// Offre partenaire (GET /api/offers, vitrine publique).
export type Offer = {
  id: string;
  partnerName: string;
  cost: number;
  discountPercent: number;
  category: Category;
  isActive: boolean;
  // Stock de codes promo (présent uniquement dans la liste admin).
  availableCodes?: number;
  usedCodes?: number;
  // Indicateur de dispo côté vitrine (≥1 code dispo), sans révéler le nombre.
  available?: boolean;
};
