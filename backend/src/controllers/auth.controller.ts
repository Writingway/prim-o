import type { Request, Response, NextFunction } from 'express';
import { registerManagerSchema, registerEmployeeSchema } from '../schemas/auth.schemas';
import { AppError } from '../middleware/error.middleware';
import { loginSchema } from '../schemas/auth.schemas';
import { config } from '../config';
import { REFRESH_TTL_MS } from '../lib/token';
import {
  registerManager,
  registerEmployee,
  loginManager,
  loginEmployee,
  refreshTokens,
  logout
} from '../services/auth.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: REFRESH_TTL_MS,
  path: '/api/auth',
};

export async function registerManagerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerManagerSchema.parse(req.body);
    const manager = await registerManager(input);
    res.status(201).json({ manager });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
      return;
    }
    next(err);
  }
}

export async function registerEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerEmployeeSchema.parse(req.body);
    const employee = await registerEmployee(input);
    res.status(201).json({ employee });
  } catch (err) {
    if (err instanceof Error && err.message === 'MANAGER_NOT_FOUND') {
      next(new AppError(404, 'Manager introuvable.'));
      return;
    }
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
      return;
    }
    next(err);
  }
}

export async function loginManagerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await loginManager(input);

    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
    res.status(200).json({ accessToken });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      next(new AppError(401, 'Email ou mot de passe incorrect.'));
      return;
    }
    next(err);
  }
}

export async function loginEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await loginEmployee(input);

    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
    res.status(200).json({ accessToken });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      next(new AppError(401, 'Email ou mot de passe incorrect.'));
      return;
    }
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) { next(new AppError(401, 'Refresh token manquant.')); return; }

    const { accessToken, refreshToken } = await refreshTokens(rawToken);
    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
    res.status(200).json({ accessToken });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_REFRESH') {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      next(new AppError(401, 'Session invalide, reconnecte-toi.'));
      return;
    }
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) await logout(rawToken);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
