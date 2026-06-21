import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { createAttributionSchema, allocateSchema, distributeEnvelopeSchema } from '../schemas/attribution.schemas';
import {
  createAttribution,
  listAttributionsByCompany,
  allocateToManager,
  listCompanyManagers,
  getUserBalance,
  distributeEnvelope,
  listManagerEnvelopes,
  getManagerBalances,
} from '../services/attribution.service';
import { requireManagerOrOwner } from '../middleware/authz';

export async function createAttributionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    if (ctx.role === 'MANAGER') {
      next(new AppError(403, 'Les managers distribuent via leurs enveloppes (/attributions/distribute).'));
      return;
    }

    const input = createAttributionSchema.parse(req.body);

    const attribution = await createAttribution(ctx.userId, ctx.role, ctx.companyId, input);
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
    const { managerId, amount, mode, percentage } = allocateSchema.parse(req.body);
    const { allocation, companyTokenBalance } = await allocateToManager(
      companyId, req.user.id, managerId, amount, mode, percentage ?? null,
    );
    res.status(201).json({
      allocationId: allocation.id,
      managerId,
      amount: allocation.amount,
      mode: allocation.mode,
      percentage: allocation.percentage,
      status: allocation.status,
      companyTokenBalance,
    });
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

// POST /api/attributions/distribute — le manager redistribue une enveloppe (envoi unique).
export async function distributeEnvelopeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    const input = distributeEnvelopeSchema.parse(req.body);
    const result = await distributeEnvelope(ctx.userId, ctx.companyId, input);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        ALLOCATION_NOT_FOUND:           [404, 'Enveloppe introuvable.'],
        ALLOCATION_NOT_OWNED:           [403, "Cette enveloppe ne t'appartient pas."],
        ALLOCATION_NOT_IN_COMPANY:      [403, "Cette enveloppe n'appartient pas à ton entreprise."],
        ALLOCATION_ALREADY_DISTRIBUTED: [409, 'Cette enveloppe a déjà été distribuée.'],
        DISTRIBUTION_MISMATCH:          [422, "Le total distribué doit égaler le budget de l'enveloppe."],
        EMPLOYEE_INVALID:               [422, 'Un ou plusieurs employés sont invalides.'],
        MOTIF_INVALID:                  [422, 'Un ou plusieurs motifs sont invalides ou inactifs.'],
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

// GET /api/attributions/envelopes — enveloppes du manager courant ("Mes enveloppes").
export async function listEnvelopesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;
    const envelopes = await listManagerEnvelopes(ctx.userId, ctx.companyId);
    res.status(200).json({ envelopes });
  } catch (err) {
    next(err);
  }
}

// GET /api/attributions/balances — doubles soldes du manager courant.
export async function balancesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;
    const balances = await getManagerBalances(ctx.userId, ctx.companyId);
    res.status(200).json(balances);
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
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;
    const managers = await listCompanyManagers(ctx.companyId);
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
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    const attributions = await listAttributionsByCompany(ctx.companyId);
    res.status(200).json({ attributions });
  } catch (err) {
    next(err);
  }
}
