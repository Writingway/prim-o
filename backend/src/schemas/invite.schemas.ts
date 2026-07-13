import { z } from 'zod';

// Invite code generation by a manager. All bounds are enforced server-side; the client is
// never trusted.
//  - maxUses: cap on how many signups a single code allows (abuse guard).
//  - expiresInHours: validity window, 24h by default (business rule) and 24h at most.
export const generateInviteSchema = z.object({
  maxUses: z.number().int().min(1).max(100).optional().default(5),
  expiresInHours: z.number().int().min(1).max(24).optional().default(24),
  role: z.enum(['EMPLOYEE', 'MANAGER']).optional().default('EMPLOYEE'),
});

export type GenerateInviteInput = z.infer<typeof generateInviteSchema>;
