import { authRequest } from "./client";

// Un code promo tel que renvoyé à l'admin.
export type AdminPromoCode = {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt: string | null;
};

// Liste les codes d'une offre (admin) : dispo d'abord, puis utilisés.
export const listPromoCodes = (offerId: string) =>
  authRequest<{ codes: AdminPromoCode[] }>('GET', `/admin/offers/${offerId}/promo-codes`);

// Supprime un code promo (admin) - réussit seulement s'il est encore disponible.
export const deletePromoCode = (codeId: string) =>
  authRequest<{ ok: boolean }>('DELETE', `/admin/promo-codes/${codeId}`);

// Ajoute en lot des codes promo à une offre (admin).
// Renvoie le compte-rendu { added, skipped }.
export const addPromoCodes = (offerId: string, codes: string[]) =>
  authRequest<{ added: number; skipped: number }>(
    'POST',
    `/admin/offers/${offerId}/promo-codes`,
    { codes },
  );
