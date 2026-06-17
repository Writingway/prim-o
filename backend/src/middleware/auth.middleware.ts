import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/token';
import { AppError } from './error.middleware';
import { prisma } from '../lib/db';


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

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Token says ADMIN, but role/status can change mid-session. The 15-min
  // access token would otherwise honor a stale role. Re-check live.
  if (req.user?.role !== 'ADMIN') {
    next(new AppError(403, 'Accès réservé aux administrateurs.'));
    return;
  }
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id, deletedAt: null },
      select: { role: true, status: true },
    });
    if (!user || user.role !== 'ADMIN' || user.status !== 'APPROVED') {
      next(new AppError(403, 'Accès réservé aux administrateurs.'));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
