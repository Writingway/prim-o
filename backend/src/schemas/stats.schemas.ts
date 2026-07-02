import { z } from 'zod';

// Optional filters for GET /api/stats. from/to bound Attribution.createdAt.
// teamId is accepted but ignored in V1 (no distinct team entity; scope is the companyId).
export const statsQuerySchema = z
  .object({
    teamId: z.uuid().optional(),
    // §3.5 — scopes the evolution curve to a single employee.
    employeeId: z.uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((d) => !(d.from && d.to) || d.from <= d.to, {
    message: 'from doit être antérieur ou égal à to.',
    path: ['from'],
  });

export type StatsQuery = z.infer<typeof statsQuerySchema>;
