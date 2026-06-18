import type { Request, NextFunction } from 'express';
import { AppError } from './error.middleware';

// Garde commun aux routes "espace entreprise" : MANAGER et OWNER y accèdent.
// OWNER est un sur-ensemble du MANAGER (tout ce que fait le manager + l'achat de tokens).
// Renvoie le companyId (issu du token, jamais du body) ou null après avoir
// signalé l'erreur via next() — même idiome que requireEmployee().
export function requireManagerOrOwner(req: Request, next: NextFunction): string | null {
  if (req.user?.role !== 'MANAGER' && req.user?.role !== 'OWNER') {
    next(new AppError(403, 'Accès réservé aux managers et patrons.'));
    return null;
  }
  const companyId = req.user.companyId;
  if (!companyId) {
    next(new AppError(403, 'Aucune entreprise associée.'));
    return null;
  }
  return companyId;
}
