import { Offer } from "../../types/types";
import { authRequest } from "./client";

// Vitrine des offres partenaires. Public sur la landing (pas de token
// en mémoire → pas de Bearer), authentifié côté admin.
export const listOffers = () => authRequest<{ offers: Offer[] }>('GET', '/offers');

type OfferWritePayload = {
  partnerName: string;
  cost: number;
  discountPercent: number;
  categoryId: string;
  isActive?: boolean;
};

// Crée une offre (admin). isActive/id/category sont posés côté serveur à partir de categoryId.
export const createOffer = (payload: OfferWritePayload) =>
  authRequest<{ offer: Offer }>('POST', '/admin/offers', payload);

// Met à jour une offre (admin).
export const updateOffer = (offerId: string, payload: Partial<OfferWritePayload>) =>
  authRequest<{ offer: Offer }>('PATCH', `/admin/offers/${offerId}`, payload);

// Désactive une offre (soft delete, admin).
export const deactivateOffer = (offerId: string) =>
  authRequest<{ offer: Offer }>('DELETE', `/admin/offers/${offerId}`);

// Upload de la photo d'une offre (admin). Multipart : champ « image ».
export const uploadOfferImage = (offerId: string, file: File) => {
  const form = new FormData();
  form.append('image', file);
  return authRequest<{ offer: Offer }>('PATCH', `/admin/offers/${offerId}/image`, form);
};

// Retire la photo d'une offre (admin).
export const deleteOfferImage = (offerId: string) =>
  authRequest<{ offer: Offer }>('DELETE', `/admin/offers/${offerId}/image`);
