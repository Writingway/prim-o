import type { Request, Response, NextFunction } from 'express';
import { registerCompanySchema, registerUserSchema } from '../schemas/auth.schemas';
import { AppError } from '../middleware/error.middleware';
import { loginSchema } from '../schemas/auth.schemas';
import { config } from '../config';
import { REFRESH_TTL_MS } from '../lib/token';
import {
  registerCompany,
  registerUser,
  refreshTokens,
  login,
  logout,
  verifyEmail
} from '../services/auth.service';


const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: REFRESH_TTL_MS,
  path: '/api/auth',
};

export async function registerCompanyController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerCompanySchema.parse(req.body);
    const company = await registerCompany(input);
    res.status(201).json({ company });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
      return;
    }
    next(err);
  }
}

export async function registerUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerUserSchema.parse(req.body);
    const employee = await registerUser(input);
    res.status(201).json({ employee });
  } catch (err) {

    if (err instanceof Error && err.message === 'INVALID_CODE') {
      next(new AppError(410, 'Code entreprise invalide ou expiré.'));
      return;
    }

    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
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

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await login(input);
    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
    res.status(200).json({ accessToken });


  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      next(new AppError(401, 'Email ou mot de passe invalide.'));
      return;
    }

    if (err instanceof Error && err.message === 'USER_NOT_APPROVED') {
      next(new AppError(403, 'Utilisateur en attente de validation.'));
      return;
    }
    
    if (err instanceof Error && err.message === 'EMAIL_NOT_VERIFIED') {
      next(new AppError(403, 'Email non vérifié. Vérifie ta boîte mail.'));
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

// GET /api/auth/verify-email?token=... — cliqué depuis l'email.
// Consomme le token côté serveur puis REDIRIGE vers le front avec un flag.
export async function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.query.token;
    if (typeof token !== 'string' || token.length === 0) {
      res.redirect(`${config.CLIENT_URL}/?verified=0&reason=missing`);
      return;
    }
    await verifyEmail(token);
    res.redirect(`${config.CLIENT_URL}/?verified=1`);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_VERIFICATION') {
      res.redirect(`${config.CLIENT_URL}/?verified=0&reason=invalid`);
      return;
    }
    next(err);
  }
}
