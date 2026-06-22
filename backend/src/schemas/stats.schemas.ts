import { z } from 'zod';

// GET /api/stats — filtres optionnels. from/to = bornes sur Attribution.createdAt.
// teamId accepté mais IGNORÉ en V1 (pas d'entité équipe distincte ; scope = companyId).
export const statsQuerySchema = z
  .object({
    teamId: z.uuid().optional(),
    employeeId: z.uuid().optional(), // §3.5 — scope la courbe d'évolution sur un employé
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((d) => !(d.from && d.to) || d.from <= d.to, {
    message: 'from doit être antérieur ou égal à to.',
    path: ['from'],
  });

export type StatsQuery = z.infer<typeof statsQuerySchema>;
