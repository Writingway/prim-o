import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { createAttributionSchema } from '../schemas/attribution.schemas';
import { createAttribution, listAttributionsByCompany } from '../services/attribution.service';

export async function createAttributionController(
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

    const input = createAttributionSchema.parse(req.body);

    const attribution = await createAttribution(req.user.id, companyId, input);
    res.status(201).json({ attribution });
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        EMPLOYEE_NOT_FOUND:      [404, 'Employé introuvable.'],
        EMPLOYEE_NOT_IN_COMPANY: [403, "Cet employé n'appartient pas à votre entreprise."],
        COMPANY_NOT_FOUND:       [404, 'Entreprise introuvable.'],
        INSUFFICIENT_POOL:       [409, 'Solde de tokens insuffisant dans le pool entreprise.'],
      };
      const mapped = map[err.message];
      if (mapped) { next(new AppError(mapped[0], mapped[1])); return; }
    }
    next(err);
  }
}

// GET /api/attributions — historique des attributions de l'entreprise du manager.
export async function listAttributionsController(
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

    const attributions = await listAttributionsByCompany(companyId);
    res.status(200).json({ attributions });
  } catch (err) {
    next(err);
  }
}
