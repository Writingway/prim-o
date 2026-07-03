import { z } from 'zod';

// Manager-to-employee distribution (§3.3/§3.5). The motif (allocation reason) is mandatory -
// the free-text `reason` field was removed; the motif alone carries the meaning.
export const createAttributionSchema = z.object({
  employeeId: z.uuid(),
  amount:     z.number().int().positive(),
  motifId:    z.uuid(),
});

export type CreateAttributionInput = z.infer<typeof createAttributionSchema>;

// Employer-to-manager allocation (§3.2/§3.4) with a distribution mode.
// `percentage` is required only in POURCENTAGE mode (1..100) and forbidden otherwise.
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

// Bulk manager-to-employee send from an envelope (§3.3). The redistribution is complete and
// atomic: every line requires a motif, and an employee may appear only once.
export const distributeEnvelopeSchema = z.object({
  allocationId: z.uuid(),
  lines: z
    .array(
      z.object({
        employeeId: z.uuid(),
        amount:     z.number().int().positive(),
        motifId:    z.uuid(),
      }),
    )
    .min(1)
    .refine(
      (lines) => new Set(lines.map((l) => l.employeeId)).size === lines.length,
      { message: 'Un employé ne peut apparaître qu’une seule fois dans la répartition.' },
    ),
});

export type DistributeEnvelopeInput = z.infer<typeof distributeEnvelopeSchema>;
