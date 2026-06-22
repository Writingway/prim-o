import { authRequest } from "./client";

// Miroir des shapes backend (§3.5) — manager.contracts.ts côté API.
export type MotifCategory =
  | 'COMPORTEMENTS_INDIVIDUELS'
  | 'RELATION_CLIENT'
  | 'ESPRIT_COLLECTIF'
  | 'ENGAGEMENT';

export type Motif = {
  id: string;
  tag: string;
  label: string;
  category: MotifCategory;
  compliment: string;
};

export type MotifCategoryGroup = { category: MotifCategory; motifs: Motif[] };
export type ListMotifsResponse = { categories: MotifCategoryGroup[] };

// Liste officielle des motifs actifs, groupée par catégorie (pour le sélecteur de distribution).
export const listMotifs = () =>
  authRequest<ListMotifsResponse>('GET', '/motifs');
