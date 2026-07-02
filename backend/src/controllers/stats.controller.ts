import type { Request, Response, NextFunction } from 'express';
import { requireOwner } from '../middleware/authz';
import { statsQuerySchema } from '../schemas/stats.schemas';
import { getStats } from '../services/stats.service';

// GET /api/stats?from=&to=&employeeId= — employer dashboard (spec §3.2/§3.4).
// OWNER only, scoped to their company. No try/catch: Express 5 propagates rejections
// (Zod errors included).
export async function getStatsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ctx = requireOwner(req, next);
  if (!ctx) return;

  const { from, to, employeeId } = statsQuerySchema.parse(req.query);
  const stats = await getStats(ctx.companyId, { from, to, employeeId });
  res.json(stats);
}
