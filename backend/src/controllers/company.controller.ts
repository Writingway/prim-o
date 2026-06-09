import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { getCompany } from '../services/company.service';

// GET /api/company — infos de l'entreprise du manager connecté (dont le pool de tokens).
export async function getCompanyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user?.role !== 'MANAGER') {
      next(new AppError(403, 'Accès réservé aux managers.'));
      return;
    }

    const companyId = req.user.companyId;
    if (!companyId) {
      next(new AppError(403, 'Aucune entreprise associée à ce compte.'));
      return;
    }

    const company = await getCompany(companyId);
    res.status(200).json({ company });
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_NOT_FOUND') {
      next(new AppError(404, 'Entreprise introuvable.'));
      return;
    }
    next(err);
  }
}
