import { authRequest } from "./client";

// Ajoute en lot des codes promo à une offre (admin).
// Renvoie le compte-rendu { added, skipped }.
export const addPromoCodes = (offerId: string, codes: string[]) =>
  authRequest<{ added: number; skipped: number }>(
    'POST',
    `/admin/offers/${offerId}/promo-codes`,
    { codes },
  );
