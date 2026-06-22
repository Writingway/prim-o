import { z } from 'zod';

// Distribution manager → employé (§3.3/§3.5). Le motif est OBLIGATOIRE (tag
// officiel) — le texte libre `reason` a été retiré (le motif porte le sens).
export const createAttributionSchema = z.object({
  employeeId: z.uuid(),
  amount:     z.number().int().positive(),
  motifId:    z.uuid(),
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

// Envoi groupé manager → employés depuis une enveloppe (§3.3). Redistribution COMPLÈTE
// et atomique : chaque ligne a un motif obligatoire ; un employé n'apparaît qu'une fois.
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
