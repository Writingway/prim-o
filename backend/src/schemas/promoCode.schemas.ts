import { z } from 'zod';

// Ajout en lot de codes promo à une offre.
// - au moins 1 entrée, plafond 500 pour éviter un payload énorme
// - on n'exige PAS que chaque ligne soit non vide : le service trimme et
//   filtre les vides (robuste face à un coller avec lignes blanches).
export const addPromoCodesSchema = z.object({
  codes: z.array(z.string()).min(1).max(500),
});

export type AddPromoCodesInput = z.infer<typeof addPromoCodesSchema>;
