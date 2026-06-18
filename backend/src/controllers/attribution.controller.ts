import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { createAttributionSchema, allocateSchema } from '../schemas/attribution.schemas';
import {
  createAttribution,
  listAttributionsByCompany,
  allocateToManager,
  listCompanyManagers,
  getUserBalance,
} from '../services/attribution.service';
import { requireManagerOrOwner } from '../middleware/authz';

export async function createAttributionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = requireManagerOrOwner(req, next);
    if (!companyId) return;

    const input = createAttributionSchema.parse(req.body);

    // req.user garanti non-null par requireManagerOrOwner ci-dessus.
    const attribution = await createAttribution(req.user!.id, req.user!.role, companyId, input);
    res.status(201).json({ attribution });
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        EMPLOYEE_NOT_FOUND:      [404, 'Employé introuvable.'],
        EMPLOYEE_NOT_IN_COMPANY: [403, "Cet employé n'appartient pas à votre entreprise."],
        COMPANY_NOT_FOUND:       [404, 'Entreprise introuvable.'],
        COMPANY_INACTIVE:        [403, 'Entreprise non validée.'],
        INSUFFICIENT_POOL:       [409, 'Solde de tokens insuffisant dans le pool entreprise.'],
        INSUFFICIENT_BALANCE:    [409, 'Ton solde de tokens est insuffisant.'],
      };
      const mapped = map[err.message];
      if (mapped) { next(new AppError(mapped[0], mapped[1])); return; }
    }
    next(err);
  }
}

// POST /api/attributions/allocate — le patron alloue des tokens à un manager.
export async function allocateController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user?.role !== 'OWNER') {
      next(new AppError(403, 'Seul le patron peut allouer des tokens à un manager.'));
      return;
    }
    const companyId = req.user.companyId;
    if (!companyId) {
      next(new AppError(403, 'Aucune entreprise associée.'));
      return;
    }
    const { managerId, amount } = allocateSchema.parse(req.body);
    const manager = await allocateToManager(companyId, managerId, amount);
    res.status(201).json({ manager });
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        MANAGER_NOT_FOUND:      [404, 'Manager introuvable.'],
        MANAGER_NOT_IN_COMPANY: [403, "Ce manager n'appartient pas à votre entreprise."],
        COMPANY_NOT_FOUND:      [404, 'Entreprise introuvable.'],
        COMPANY_INACTIVE:       [403, 'Entreprise non validée.'],
        INSUFFICIENT_POOL:      [409, 'Solde insuffisant dans le pool entreprise.'],
      };
      const mapped = map[err.message];
      if (mapped) { next(new AppError(mapped[0], mapped[1])); return; }
    }
    next(err);
  }
}

// GET /api/attributions/my-balance — solde perso de l'utilisateur courant.
export async function myBalanceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'Non authentifié.'));
      return;
    }
    const balance = await getUserBalance(req.user.id);
    res.status(200).json({ balance });
  } catch (err) {
    next(err);
  }
}

// GET /api/attributions/managers — liste des managers de l'entreprise (patron).
export async function listManagersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = requireManagerOrOwner(req, next);
    if (!companyId) return;
    const managers = await listCompanyManagers(companyId);
    res.status(200).json({ managers });
  } catch (err) {
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
    const companyId = requireManagerOrOwner(req, next);
    if (!companyId) return;

    const attributions = await listAttributionsByCompany(companyId);
    res.status(200).json({ attributions });
  } catch (err) {
    next(err);
  }
}
