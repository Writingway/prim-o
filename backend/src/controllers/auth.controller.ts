import type { Request, Response, NextFunction } from 'express';
import {
  registerSchema,
  createCompanySchema,
  joinCompanySchema,
  loginSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: REFRESH_TTL_MS,
  path: '/api/auth',
};

// Express 5 forwards async rejections to errorHandler: no try/catch or per-string remapping
// here — the code -> HTTP mapping is centralized.

export async function registerController(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  await register(input);
  // No auto-login: the user must activate the account via the verification email first.
  res.status(201).json({ message: 'Compte créé. Vérifie ton email pour activer ton compte.' });
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
    // Session is invalid: clear the stale cookie so the client stops replaying it.
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

// Identity source of truth for the frontend (role, companyId, company.status).
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

// Link clicked from the email (GET). Consumes the token server-side then redirects to the
// frontend. Local try/catch: redirect even on failure — never return error JSON on a browser
// navigation.
export async function verifyEmailController(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  try {
    await verifyEmail(token);
    res.redirect(`${config.CLIENT_URL}/auth?verified=1`);
  } catch {
    res.redirect(`${config.CLIENT_URL}/auth?verified=0`);
  }
}

// Resend the verification link. Response is always generic (anti-enumeration): the service
// stays silent when the email is unknown or already verified.
export async function resendVerificationController(req: Request, res: Response): Promise<void> {
  const { email } = resendVerificationSchema.parse(req.body);
  await resendVerification(email);
  res.status(200).json({ message: "Si un compte existe et n'est pas vérifié, un email vient d'être renvoyé." });
}

// Forgot password: triggers the reset link email. Same generic anti-enumeration response.
export async function forgotPasswordController(req: Request, res: Response): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(email);
  res.status(200).json({ message: "Si un compte correspond à cet email, un lien de réinitialisation a été envoyé." });
}

// Consume the reset token and set the new password (revokes all sessions).
export async function resetPasswordController(req: Request, res: Response): Promise<void> {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await resetPassword(token, password);
  res.status(200).json({ message: 'Mot de passe réinitialisé. Tu peux te connecter.' });
}
