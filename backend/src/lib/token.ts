import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

// Access tokens are deliberately short-lived: anything security-sensitive re-checks the DB
// (see requireAdmin), so a stale role expires within 15 minutes.
const ACCESS_TTL = '15m';
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(userId: string, role: string | null, companyId?: string): string {
  const payload: any = { role };
  if (companyId) {
    payload.companyId = companyId;
  }
  return jwt.sign(payload, config.JWT_SECRET, { subject: userId, expiresIn: ACCESS_TTL });
}

// Refresh token: the raw value goes to the client, only the sha256 hash is stored in DB.
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashRefreshToken(raw) };
}

// Email verification token: same scheme as refresh — raw goes into the link, sha256 hash
// into the DB.
export function generateEmailVerificationToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashRefreshToken(raw) };
}

// Password reset token: same raw + sha256-hash scheme.
export function generatePasswordResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashRefreshToken(raw) };
}

// Hash an incoming raw token so it can be matched against the stored hash.
export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export interface AccessPayload { sub: string; role: string | null; companyId?: string; }

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET); // throws on bad signature or expiry
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('INVALID_TOKEN');
  }
  return { sub: decoded.sub, role: (decoded.role ?? null) as string | null, companyId: (decoded as any).companyId };
}
