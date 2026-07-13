import z from 'zod';
import { safeText } from '../lib/validation';

export const createOfferSchema = z.object({
  partnerName: safeText(1),
  cost:        z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100),
  categoryId:  z.uuid(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const updateOfferSchema = z.object({
  partnerName: safeText(1).optional(),
  cost:        z.number().int().positive().optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  categoryId:  z.uuid().optional(),
  isActive:    z.boolean().optional(),
});

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
