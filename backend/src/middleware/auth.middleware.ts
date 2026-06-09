import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/token';
import { AppError } from './error.middleware';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Token manquant.'));
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      ...(payload.companyId ? { companyId: payload.companyId } : {}),
    }; // injecte les infos du token dans req.user
    next(); // route protégée accessible
  } catch {
    next(new AppError(401, 'Token invalide ou expiré.'));
  }
}


// Auth optionnelle : peuple req.user si un token valide est présent,
// sinon laisse passer en anonyme (utilisé sur les routes à lecture publique
// qui adaptent leur réponse selon le rôle, ex. vitrine des offres).
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = {
      id: payload.sub,
      role: payload.role,
      ...(payload.companyId ? { companyId: payload.companyId } : {}),
    };
  } catch {
    // Token invalide/expiré : on reste anonyme plutôt que de rejeter.
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    next(new AppError(403, 'Accès réservé aux administrateurs.'));
    return;
  }
  next(); // route accessible aux admins
}