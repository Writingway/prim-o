import { Offer } from "../../types/types";
import { authRequest } from "./client";

// Vitrine des offres partenaires. Public sur la landing (pas de token
// en mémoire → pas de Bearer), authentifié côté admin.
export const listOffers = () => authRequest<{ offers: Offer[] }>('GET', '/offers');

// Crée une offre (admin). isActive/id sont posés côté serveur.
export const createOffer = (payload: Omit<Offer, 'id' | 'isActive'>) =>
  authRequest<{ offer: Offer }>('POST', '/admin/offers', payload);

// Met à jour une offre (admin).
export const updateOffer = (offerId: string, payload: Partial<Omit<Offer, 'id'>>) =>
  authRequest<{ offer: Offer }>('PATCH', `/admin/offers/${offerId}`, payload);

// Désactive une offre (soft delete, admin).
export const deactivateOffer = (offerId: string) =>
  authRequest<{ offer: Offer }>('DELETE', `/admin/offers/${offerId}`);
