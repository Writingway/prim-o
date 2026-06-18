import { authRequest } from "./client";

// L'employé échange ses tokens contre un code promo d'une offre.
// Renvoie le code obtenu (à révéler), le nom de l'offre et le coût débité.
export const redeemOffer = (offerId: string) =>
  authRequest<{ redemptionId: string; code: string; offerName: string; amount: number }>(
    'POST',
    '/employees/me/redeem',
    { offerId },
  );
