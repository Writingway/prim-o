export type Category = {
  id: string;
  slug: string;
  label: string;
  // IconName value from the icon set.
  icon: string;
  // Hex color, e.g. "#e5784a".
  color: string;
  sortOrder?: number;
  isActive?: boolean;
};

// Partner offer (GET /api/offers, public storefront).
export type Offer = {
  id: string;
  partnerName: string;
  cost: number;
  discountPercent: number;
  category: Category;
  isActive: boolean;
  // Photo uploaded by the admin (/uploads/offers/… path); null/absent falls back to the category
  // thumbnail.
  imageUrl?: string | null;
  // Promo-code stock, present only in the admin list.
  availableCodes?: number;
  usedCodes?: number;
  // Storefront availability flag (at least one code left) without revealing the count.
  available?: boolean;
};
