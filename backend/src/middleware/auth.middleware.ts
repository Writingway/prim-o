import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/token';
import { AppError } from './error.middleware';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Token manquant.'));
    return;
  }
  const token = header.slice(7);          // vire "Bearer "
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();                                // route protégée accessible
  } catch {
    next(new AppError(401, 'Token invalide ou expiré.'));
  }
}
