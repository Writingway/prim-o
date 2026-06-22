import type { Request, Response, NextFunction } from 'express';
import { requireOwner } from '../middleware/authz';
import { statsQuerySchema } from '../schemas/stats.schemas';
import { getStats } from '../services/stats.service';

// GET /api/stats?teamId=&from=&to= — tableau de bord employeur (§3.2/§3.4).
// OWNER uniquement, scopé à sa company. Pas de try/catch : Express 5 propage (Zod incluse).
export async function getStatsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ctx = requireOwner(req, next);
  if (!ctx) return;

  const { from, to, employeeId } = statsQuerySchema.parse(req.query);
  const stats = await getStats(ctx.companyId, { from, to, employeeId });
  res.json(stats);
}
