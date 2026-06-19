import { z } from 'zod';
import { safeText } from '../lib/validation';

// Distribution manager → employé (§3.3/§3.5). Le motif est OBLIGATOIRE (tag
// officiel) — fini le texte libre. `reason` = note libre optionnelle du manager.
export const createAttributionSchema = z.object({
  employeeId: z.uuid(),
  amount:     z.number().int().positive(),
  motifId:    z.uuid(),
  reason:     safeText(1).optional(),
});

export type CreateAttributionInput = z.infer<typeof createAttributionSchema>;

// Allocation employeur → manager (§3.2/§3.4) avec mode de rétribution.
// `percentage` exigé UNIQUEMENT en mode POURCENTAGE (1..100), interdit sinon.
export const allocateSchema = z
  .object({
    managerId:  z.uuid(),
    amount:     z.number().int().positive(),
    mode:       z.enum(['PART_EGALE', 'POURCENTAGE', 'AUCUNE']),
    percentage: z.number().int().min(1).max(100).optional(),
  })
  .refine((d) => (d.mode === 'POURCENTAGE' ? d.percentage != null : d.percentage == null), {
    message: 'percentage requis (1..100) uniquement pour le mode POURCENTAGE.',
    path: ['percentage'],
  });

export type AllocateInput = z.infer<typeof allocateSchema>;
