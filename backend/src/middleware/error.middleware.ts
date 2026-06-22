import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// ============================================================
//  Erreurs typées - source unique de vérité (B1)
//  - ErrorCode      : identité stable d'une erreur métier
//  - ERROR_CATALOG  : code -> { status HTTP, message FR }
//  - DomainError    : levée par les services (type-safe, pas de chaîne magique)
//  - AppError       : erreur HTTP ad-hoc (status + message direct) - conservée
//  Le mapping code -> HTTP se fait ICI, une seule fois. Les controllers
//  ne catchent plus par chaîne : ils laissent remonter (Express 5 auto-catch async).
// ============================================================

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
  // message statique, ou builder si un détail dynamique est fourni (ex. liste d'emails)
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

/** Erreur métier levée par les services. Porte un code stable ; le HTTP est résolu au centre. */
export class DomainError extends Error {
  constructor(
    public code: ErrorCode,
    /** détail dynamique optionnel (ex. liste d'emails en conflit) */
    public detail?: string
  ) {
    super(code);
    this.name = 'DomainError';
  }
}

/** Erreur HTTP ad-hoc : status + message directs (gardes auth/authz, validations triviales). */
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
  // 1. Erreur métier typée - mapping centralisé
  if (err instanceof DomainError) {
    const { status, message } = resolveCatalog(err.code, err.detail);
    res.status(status).json({ error: message, code: err.code });
    return;
  }

  // 2. Pont de transition : service levant encore `new Error('CODE')` ou `'CODE:detail'`
  if (err instanceof Error && !(err instanceof AppError)) {
    const [rawCode, ...rest] = err.message.split(':');
    if (rawCode && (Object.values(ErrorCode) as string[]).includes(rawCode)) {
      const { status, message } = resolveCatalog(rawCode as ErrorCode, rest.join(':') || undefined);
      res.status(status).json({ error: message, code: rawCode });
      return;
    }
  }

  // 3. Erreur HTTP ad-hoc
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    return;
  }

  // 4. Validation Zod
  if (err instanceof ZodError || (err instanceof Error && err.name === 'ZodError')) {
    res.status(400).json({ error: 'Données invalides.', details: (err as ZodError).issues });
    return;
  }

  // 5. Inattendu
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
