import type { Request, NextFunction } from 'express';
import { AppError } from './error.middleware';

// Contexte appelant validé : tout est issu du token, jamais du body.
export type ManagerContext = { userId: string; role: 'MANAGER' | 'OWNER'; companyId: string };

// Garde commun aux routes "espace entreprise" : MANAGER et OWNER y accèdent.
// OWNER est un sur-ensemble du MANAGER (tout ce que fait le manager + l'achat de tokens).
// Renvoie { userId, role, companyId } validés, ou null après avoir signalé
// l'erreur via next() — même idiome que requireEmployee().
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
  // role narrowé en 'MANAGER' | 'OWNER' par le guard ci-dessus.
  return { userId: req.user.id, role: req.user.role, companyId };
}

// Garde back-office employeur : OWNER uniquement (§3.2). L'ADMIN plateforme n'a pas de
// companyId → exclu. Même idiome que requireManagerOrOwner : renvoie le contexte ou null
// après avoir signalé l'erreur via next().
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
