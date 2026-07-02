import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { getCompany } from '../services/company.service';
import { requireManagerOrOwner } from '../middleware/authz';

// GET /api/company — the connected manager/owner's company info (including the token pool).
export async function getCompanyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    const company = await getCompany(ctx.companyId);
    res.status(200).json({ company });
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_NOT_FOUND') {
      next(new AppError(404, 'Entreprise introuvable.'));
      return;
    }
    next(err);
  }
}
