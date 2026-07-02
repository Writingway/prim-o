import type { Request, NextFunction } from 'express';
import { AppError } from './error.middleware';

// Validated caller context: everything comes from the token, never from the body.
export type ManagerContext = { userId: string; role: 'MANAGER' | 'OWNER'; companyId: string };

// Shared guard for "company space" routes: MANAGER and OWNER both get in. OWNER is a superset
// of MANAGER (everything a manager can do, plus token purchase). Returns the validated
// { userId, role, companyId }, or null after reporting the error via next() — same idiom as
// requireEmployee().
export function requireManagerOrOwner(req: Request, next: NextFunction): ManagerContext | null {
  if (req.user?.role !== 'MANAGER' && req.user?.role !== 'OWNER') {
    next(new AppError(403, 'Accès réservé aux managers et patrons.'));
    return null;
  }
  const companyId = req.user.companyId;
  if (!companyId) {
    next(new AppError(403, 'Aucune entreprise associée.'));
    return null;
  }
  // role is narrowed to 'MANAGER' | 'OWNER' by the guard above.
  return { userId: req.user.id, role: req.user.role, companyId };
}

// Employer back-office guard: OWNER only (§3.2). The platform ADMIN has no companyId and is
// therefore excluded. Same idiom as requireManagerOrOwner: returns the context, or null after
// reporting the error via next().
export type OwnerContext = { userId: string; companyId: string };

export function requireOwner(req: Request, next: NextFunction): OwnerContext | null {
  if (req.user?.role !== 'OWNER') {
    next(new AppError(403, 'Accès réservé au patron.'));
    return null;
  }
  const companyId = req.user.companyId;
  if (!companyId) {
    next(new AppError(403, 'Aucune entreprise associée.'));
    return null;
  }
  return { userId: req.user.id, companyId };
}
