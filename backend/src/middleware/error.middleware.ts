import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Typed errors — single source of truth.
// - ErrorCode: stable identity of a business error.
// - ERROR_CATALOG: code -> { HTTP status, French message }.
// - DomainError: thrown by services (type-safe, no magic strings).
// - AppError: ad-hoc HTTP error (direct status + message), kept for guards.
// The code -> HTTP mapping happens HERE, exactly once. Controllers no longer catch by string:
// they let errors bubble up (Express 5 auto-catches async rejections).

export enum ErrorCode {
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  ALREADY_IN_COMPANY = 'ALREADY_IN_COMPANY',
  INVALID_CODE = 'INVALID_CODE',
  INVALID_REFRESH = 'INVALID_REFRESH',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  CODE_GENERATION_FAILED = 'CODE_GENERATION_FAILED',
  COMPANY_INACTIVE = 'COMPANY_INACTIVE',
  COMPANY_NOT_APPROVED = 'COMPANY_NOT_APPROVED',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYEE_NOT_IN_COMPANY = 'EMPLOYEE_NOT_IN_COMPANY',
  COMPANY_NOT_FOUND = 'COMPANY_NOT_FOUND',
  COMPANY_NOT_DELETED = 'COMPANY_NOT_DELETED',
  COMPANY_RESTORE_EMAIL_CLASH = 'COMPANY_RESTORE_EMAIL_CLASH',
  LAST_ADMIN = 'LAST_ADMIN',
  ROLE_REQUIRES_COMPANY = 'ROLE_REQUIRES_COMPANY',
  INSUFFICIENT_POOL = 'INSUFFICIENT_POOL',
  INVALID_SESSION_METADATA = 'INVALID_SESSION_METADATA',
  INVALID_TOKEN = 'INVALID_TOKEN',
  STRIPE_SESSION_NO_URL = 'STRIPE_SESSION_NO_URL',
}

interface CatalogEntry {
  status: number;
  // Static message, or a builder when a dynamic detail is provided (e.g. a list of emails).
  message: string | ((detail?: string) => string);
}

const ERROR_CATALOG: Record<ErrorCode, CatalogEntry> = {
  [ErrorCode.EMAIL_TAKEN]: { status: 409, message: 'Email déjà utilisé.' },
  [ErrorCode.ALREADY_IN_COMPANY]: { status: 409, message: "Tu fais déjà partie d'une entreprise." },
  [ErrorCode.INVALID_CODE]: { status: 410, message: 'Code entreprise invalide ou expiré.' },
  [ErrorCode.INVALID_REFRESH]: { status: 401, message: 'Session invalide, reconnecte-toi.' },
  [ErrorCode.INVALID_CREDENTIALS]: { status: 401, message: 'Email ou mot de passe invalide.' },
  [ErrorCode.EMAIL_NOT_VERIFIED]: { status: 403, message: 'Email non vérifié. Vérifie ta boîte mail.' },
  [ErrorCode.USER_NOT_FOUND]: { status: 404, message: 'Utilisateur introuvable.' },
  [ErrorCode.INVALID_PASSWORD]: { status: 401, message: 'Mot de passe incorrect.' },
  [ErrorCode.CODE_GENERATION_FAILED]: { status: 500, message: 'Impossible de générer un code, réessaie.' },
  [ErrorCode.COMPANY_INACTIVE]: { status: 403, message: 'Entreprise non validée.' },
  [ErrorCode.COMPANY_NOT_APPROVED]: { status: 403, message: 'Entreprise non validée.' },
  [ErrorCode.EMPLOYEE_NOT_FOUND]: { status: 404, message: 'Employé introuvable.' },
  [ErrorCode.EMPLOYEE_NOT_IN_COMPANY]: { status: 403, message: "Cet employé n'appartient pas à votre entreprise." },
  [ErrorCode.COMPANY_NOT_FOUND]: { status: 404, message: 'Entreprise introuvable.' },
  [ErrorCode.COMPANY_NOT_DELETED]: { status: 404, message: 'Entreprise introuvable ou déjà active.' },
  [ErrorCode.COMPANY_RESTORE_EMAIL_CLASH]: {
    status: 409,
    message: (detail) => `Restauration impossible : email(s) déjà réutilisé(s) : ${detail ?? ''}.`,
  },
  [ErrorCode.LAST_ADMIN]: { status: 409, message: "Impossible : c'est le dernier administrateur actif." },
  [ErrorCode.ROLE_REQUIRES_COMPANY]: { status: 400, message: 'Ce rôle exige une entreprise.' },
  [ErrorCode.INSUFFICIENT_POOL]: { status: 409, message: 'Solde du pool entreprise insuffisant.' },
  [ErrorCode.INVALID_SESSION_METADATA]: { status: 400, message: 'Métadonnées de session invalides.' },
  [ErrorCode.INVALID_TOKEN]: { status: 401, message: 'Token invalide.' },
  [ErrorCode.STRIPE_SESSION_NO_URL]: { status: 502, message: 'Stripe : URL de session manquante.' },
};

/** Business error thrown by services. Carries a stable code; the HTTP status is resolved centrally. */
export class DomainError extends Error {
  constructor(
    public code: ErrorCode,
    /** Optional dynamic detail (e.g. list of conflicting emails). */
    public detail?: string
  ) {
    super(code);
    this.name = 'DomainError';
  }
}

/** Ad-hoc HTTP error with direct status + message (auth/authz guards, trivial validations). */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function resolveCatalog(code: ErrorCode, detail?: string): { status: number; message: string } {
  const entry = ERROR_CATALOG[code];
  const message = typeof entry.message === 'function' ? entry.message(detail) : entry.message;
  return { status: entry.status, message };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof DomainError) {
    const { status, message } = resolveCatalog(err.code, err.detail);
    res.status(status).json({ error: message, code: err.code });
    return;
  }

  // Transition bridge for services that still throw `new Error('CODE')` or `'CODE:detail'`.
  if (err instanceof Error && !(err instanceof AppError)) {
    const [rawCode, ...rest] = err.message.split(':');
    if (rawCode && (Object.values(ErrorCode) as string[]).includes(rawCode)) {
      const { status, message } = resolveCatalog(rawCode as ErrorCode, rest.join(':') || undefined);
      res.status(status).json({ error: message, code: rawCode });
      return;
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    return;
  }

  // The name check catches ZodError instances from a duplicated zod copy, where instanceof fails.
  if (err instanceof ZodError || (err instanceof Error && err.name === 'ZodError')) {
    res.status(400).json({ error: 'Données invalides.', details: (err as ZodError).issues });
    return;
  }

  // Anything else is unexpected: log it, return an opaque 500.
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
