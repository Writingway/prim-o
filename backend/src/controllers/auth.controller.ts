import type { Request, Response, NextFunction } from 'express';
import {
  registerSchema,
  createCompanySchema,
  joinCompanySchema,
  loginSchema,
} from '../schemas/auth.schemas';
import { AppError, DomainError, ErrorCode } from '../middleware/error.middleware';
import { config } from '../config';
import { REFRESH_TTL_MS } from '../lib/token';
import {
  register,
  createCompany,
  joinCompany,
  refreshTokens,
  login,
  logout,
  getMe,
} from '../services/auth.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: REFRESH_TTL_MS,
  path: '/api/auth',
};

// Express 5 propage les rejets async vers errorHandler : pas de try/catch
// ni de remap par chaîne ici — le mapping code -> HTTP est centralisé.

export async function registerController(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const { accessToken, refreshToken } = await register(input);
  res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
  res.status(201).json({ accessToken });
}

export async function createCompanyController(req: Request, res: Response): Promise<void> {
  const input = createCompanySchema.parse(req.body);
  const { company, accessToken } = await createCompany(req.user!.id, input);
  res.status(201).json({ company, accessToken });
}

export async function joinCompanyController(req: Request, res: Response): Promise<void> {
  const input = joinCompanySchema.parse(req.body);
  const { accessToken } = await joinCompany(req.user!.id, input);
  res.status(200).json({ accessToken });
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) { next(new AppError(401, 'Refresh token manquant.')); return; }

    const { accessToken, refreshToken } = await refreshTokens(rawToken);
    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
    res.status(200).json({ accessToken });
  } catch (err) {
    // Effet de bord propre à la session invalide : on purge le cookie pourri.
    if (err instanceof DomainError && err.code === ErrorCode.INVALID_REFRESH) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
    }
    next(err);
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const { accessToken, refreshToken } = await login(input);
  res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });
  res.status(200).json({ accessToken });
}

// Source de vérité d'identité pour le front (role, companyId, company.status).
export async function meController(req: Request, res: Response): Promise<void> {
  const user = await getMe(req.user!.id);
  res.json({ user });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.refreshToken;
  if (rawToken) await logout(rawToken);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(204).end();
}
