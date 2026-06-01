import type { Request, Response, NextFunction } from 'express';
import { registerEmployerSchema, registerEmployeeSchema } from '../schemas/auth.schemas';
import { AppError } from '../middleware/error.middleware';
import { loginSchema } from '../schemas/auth.schemas';
import { config } from '../config';
import { REFRESH_TTL_MS } from '../lib/token';
import {
  registerEmployer,
  registerEmployee,
  loginEmployer,
  loginEmployee,
  refreshTokens,
  logout
} from '../services/auth.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,   // 'as const' sinon TS le voit comme string générique
  maxAge: REFRESH_TTL_MS,
  path: '/api/auth',
};

export async function registerEmployerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerEmployerSchema.parse(req.body);
    const employer = await registerEmployer(input);
    res.status(201).json({ employer });
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
    if (err instanceof Error && err.message === 'EMPLOYER_NOT_FOUND') {
      next(new AppError(404, 'Employeur introuvable.'));
      return;
    }
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
      return;
    }
    next(err);
  }
}

export async function loginEmployerController(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await loginEmployer(input);

    // pose le refresh dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, { /* options ci-dessous */
      ...refreshCookieOptions
    });

    // l'access token part dans le JSON (le front le garde en mémoire)
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

    res.cookie('refreshToken', refreshToken, {
      ...refreshCookieOptions
    });

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
    res.cookie('refreshToken', refreshToken, { 
      ...refreshCookieOptions
     });
    res.status(200).json({ accessToken });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_REFRESH') {
      res.clearCookie('refreshToken', { path: '/api/auth' });   // vire le cookie pourri
      next(new AppError(401, 'Session invalide, reconnecte-toi.'));
      return;
    }
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) await logout(rawToken); // si cookie présent, révoque DB
    res.clearCookie('refreshToken', { path: '/api/auth' }); // toujours vider cookie
    res.status(204).end(); // 204 = OK, no content
  } catch (err) {
    next(err);
  }
}
