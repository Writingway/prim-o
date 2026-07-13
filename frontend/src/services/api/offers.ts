import { Offer } from "../../types/types";
import { authRequest } from "./client";

// Partner offers showcase. Public on the landing page (no token in memory → no Bearer),
// authenticated on the admin side.
export const listOffers = () => authRequest<{ offers: Offer[] }>('GET', '/offers');

type OfferWritePayload = {
  partnerName: string;
  cost: number;
  discountPercent: number;
  categoryId: string;
  isActive?: boolean;
};

// Creates an offer (admin). isActive/id/category are set server-side from categoryId.
export const createOffer = (payload: OfferWritePayload) =>
  authRequest<{ offer: Offer }>('POST', '/admin/offers', payload);

export const updateOffer = (offerId: string, payload: Partial<OfferWritePayload>) =>
  authRequest<{ offer: Offer }>('PATCH', `/admin/offers/${offerId}`, payload);

// Deactivates an offer (soft delete, admin).
export const deactivateOffer = (offerId: string) =>
  authRequest<{ offer: Offer }>('DELETE', `/admin/offers/${offerId}`);

// Uploads an offer photo (admin). Multipart field name: "image".
export const uploadOfferImage = (offerId: string, file: File) => {
  const form = new FormData();
  form.append('image', file);
  return authRequest<{ offer: Offer }>('PATCH', `/admin/offers/${offerId}/image`, form);
};

export const deleteOfferImage = (offerId: string) =>
  authRequest<{ offer: Offer }>('DELETE', `/admin/offers/${offerId}/image`);
