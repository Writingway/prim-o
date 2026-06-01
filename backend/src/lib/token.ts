import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

const ACCESS_TTL = '15m'; // Access token time to live
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms

// 1. Access token (JWT signé)
export function signAccessToken(userId: string, role: string): string {
  //jwt.sign(payload, secret, options)
  //payload = { role } ; options = { subject: userId, expiresIn: ACCESS_TTL }
  return jwt.sign({ role }, config.JWT_SECRET, { subject: userId, expiresIn: ACCESS_TTL });
}

// 2. Refresh token : renvoie le brut (pour le client) + le hash (pour la DB)
export function generateRefreshToken(): { raw: string; hash: string } {
  //raw  = crypto.randomBytes(32).toString('hex')
  //hash = sha256(raw)  -> crypto.createHash('sha256').update(raw).digest('hex')
  //return { raw, hash }
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashRefreshToken(raw) };
}

// 3. Hash d'un refresh reçu (pour le retrouver en DB au moment du refresh)
export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export interface AccessPayload { sub: string; role: string; }

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET); // throw si signature KO ou expiré
  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw new Error('INVALID_TOKEN');
  }
  return { sub: decoded.sub, role: decoded.role as string };
}
