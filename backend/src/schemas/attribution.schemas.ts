import { z } from 'zod';
import { safeText } from '../lib/validation';

export const createAttributionSchema = z.object({
  employeeId: z.uuid(),
  amount:     z.number().int().positive(),
  reason:     safeText(1),
});

export type CreateAttributionInput = z.infer<typeof createAttributionSchema>;

// Allocation patron → manager.
export const allocateSchema = z.object({
  managerId: z.uuid(),
  amount:    z.number().int().positive(),
});

export type AllocateInput = z.infer<typeof allocateSchema>;
