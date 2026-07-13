import { z } from 'zod';

// Bulk-add of promo codes to an offer.
// - At least 1 entry, capped at 500 to keep the payload bounded.
// - Individual lines are NOT required to be non-empty: the service trims and drops blanks,
//   so pasting a list with blank lines still works.
export const addPromoCodesSchema = z.object({
  codes: z.array(z.string()).min(1).max(500),
});

export type AddPromoCodesInput = z.infer<typeof addPromoCodesSchema>;
