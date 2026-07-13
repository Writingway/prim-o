import { z } from 'zod';

// The manager only sends the number of tokens to buy.
// Positive integer, capped to block absurd amounts.
export const createCheckoutSchema = z.object({
  amount: z.number().int().positive().max(10000),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
