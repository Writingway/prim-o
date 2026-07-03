import { z } from 'zod';

// An employee redeems their tokens against an offer.
export const redeemSchema = z.object({
  offerId: z.string().uuid(),
});

export type RedeemInput = z.infer<typeof redeemSchema>;
