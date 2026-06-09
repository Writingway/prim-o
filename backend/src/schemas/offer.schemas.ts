import z from 'zod';
import { safeText } from '../lib/validation';

export const createOfferSchema = z.object({
  partnerName: safeText(1),
  cost:        z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100),
  category:    z.enum(['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER']),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const updateOfferSchema = z.object({
  partnerName: safeText(1).optional(),
  cost:        z.number().int().positive().optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  category:    z.enum(['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER']).optional(),
  isActive:    z.boolean().optional(),
});

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

