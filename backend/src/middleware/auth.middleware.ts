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
    };
    next();
  } catch {
    next(new AppError(401, 'Token invalide ou expiré.'));
  }
}


// Optional auth: populates req.user when a valid token is present, otherwise lets the request
// through as anonymous. Used on publicly readable routes that tailor their response to the
// caller's role, e.g. the offers showcase.
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
    // Invalid/expired token: stay anonymous rather than reject.
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // The token says ADMIN, but role/status can change mid-session and the 15-min access token
  // would otherwise honor a stale role — re-check against the DB.
  if (req.user?.role !== 'ADMIN') {
    next(new AppError(403, 'Accès réservé aux administrateurs.'));
    return;
  }
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id, deletedAt: null },
      select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      next(new AppError(403, 'Accès réservé aux administrateurs.'));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
