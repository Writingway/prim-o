import { z } from 'zod';

// L'employé échange ses tokens contre une offre (id en body).
export const redeemSchema = z.object({
  offerId: z.string().uuid(),
});

export type RedeemInput = z.infer<typeof redeemSchema>;
