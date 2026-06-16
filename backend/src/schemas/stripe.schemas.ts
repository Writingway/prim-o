import { z } from 'zod';

// Le manager envoie juste le nombre de tokens à acheter.
// Entier positif, plafonné pour éviter les montants absurdes.
export const createCheckoutSchema = z.object({
  amount: z.number().int().positive().max(10000),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
