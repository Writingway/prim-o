import { authRequest } from "./client";

export type AdminPromoCode = {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt: string | null;
};

// Lists an offer's codes (admin): available first, then used.
export const listPromoCodes = (offerId: string) =>
  authRequest<{ codes: AdminPromoCode[] }>('GET', `/admin/offers/${offerId}/promo-codes`);

// Deletes a promo code (admin) — succeeds only while the code is still unused.
export const deletePromoCode = (codeId: string) =>
  authRequest<{ ok: boolean }>('DELETE', `/admin/promo-codes/${codeId}`);

// Bulk-adds promo codes to an offer (admin).
export const addPromoCodes = (offerId: string, codes: string[]) =>
  authRequest<{ added: number; skipped: number }>(
    'POST',
    `/admin/offers/${offerId}/promo-codes`,
    { codes },
  );
