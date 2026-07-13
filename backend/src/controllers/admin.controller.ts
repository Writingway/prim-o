import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { 
  idParamSchema, 
  listUsersQuerySchema, 
  paginationQuerySchema, 
  updateUserSchema,
  createCompanySchema,
  companyStatusSchema
} from '../schemas/admin.schemas';
import {  
  listUsers, 
  updateUser,
  softDeleteUser,
  softDeleteCompany, 
  restoreCompany,
  getStats,
  listCompanies,
  createCompany,
  setCompanyStatus,
  listAttributions,
  listRedemptions,
  listPurchases
} from '../services/admin.service';

// Global dashboard stats for the admin (not scoped to one company).
export async function getStatsController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function listCompaniesController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const q = paginationQuerySchema.parse(req.query);
    const result = await listCompanies(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listAttributionsController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const q = paginationQuerySchema.parse(req.query);
    const result = await listAttributions(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}


// Only the name is required; tokenBalance defaults to 0.
export async function createCompanyController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const data = createCompanySchema.parse(req.body);
    const company = await createCompany(data);
    res.status(201).json({ company });
  } catch (err) {
    next(err);
  }
}


export async function softDeleteCompanyController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const companyId = idParamSchema.parse(req.params.id);
    const result = await softDeleteCompany(companyId);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_NOT_FOUND') {
      next(new AppError(404, 'Entreprise introuvable.')); return;
    }
    next(err);
  }
}

export async function restoreCompanyController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const companyId = idParamSchema.parse(req.params.id);
    const result = await restoreCompany(companyId);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_NOT_DELETED') {
      next(new AppError(404, 'Entreprise introuvable ou déjà active.')); return;
    }
    if (err instanceof Error && err.message.startsWith('EMAIL_TAKEN:')) {
      const emails = err.message.slice('EMAIL_TAKEN:'.length);
      next(new AppError(409, `Restauration impossible : email(s) déjà réutilisé(s) : ${emails}.`));
      return;
    }
    next(err);
  }
}

// Approve or reject a company in the admin validation queue: PENDING -> APPROVED/REJECTED.
export async function setCompanyStatusController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const companyId = idParamSchema.parse(req.params.id);
    const { status } = companyStatusSchema.parse(req.body);
    const company = await setCompanyStatus(companyId, status);
    res.json({ company });
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_NOT_FOUND') {
      next(new AppError(404, 'Entreprise introuvable.')); return;
    }
    next(err);
  }
}

export async function listUsersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = listUsersQuerySchema.parse(req.query);
    res.json(await listUsers(q));
  } catch (err) { next(err); }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = idParamSchema.parse(req.params.id);
    if (id === req.user!.id) {
      next(new AppError(400, 'Action impossible sur votre propre compte.')); return;
    }
    const data = updateUserSchema.parse(req.body);
    res.json({ user: await updateUser(id, data) });
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      next(new AppError(404, 'Utilisateur introuvable.')); return;
    }
    if (err instanceof Error && err.message === 'LAST_ADMIN') {
      next(new AppError(409, 'Impossible : c\'est le dernier administrateur actif.')); return;
    }
    if (err instanceof Error && err.message === 'ROLE_REQUIRES_COMPANY') {
      next(new AppError(400, 'Ce rôle exige une entreprise.')); return;
    }
    next(err);
  }
}

export async function softDeleteUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = idParamSchema.parse(req.params.id);
    if (id === req.user!.id) {
      next(new AppError(400, 'Action impossible sur votre propre compte.')); return;
    }
    res.json(await softDeleteUser(id));
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      next(new AppError(404, 'Utilisateur introuvable.')); return;
    }
    if (err instanceof Error && err.message === 'LAST_ADMIN') {
      next(new AppError(409, 'Impossible : c\'est le dernier administrateur actif.')); return;
    }
    next(err);
  }
}

export async function listRedemptionsController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const q = paginationQuerySchema.parse(req.query);
    const result = await listRedemptions(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPurchasesController(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const q = paginationQuerySchema.parse(req.query);
    const result = await listPurchases(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
