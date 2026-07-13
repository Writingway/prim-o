// Identity source of truth: GET /auth/me (role + company.status, read from the DB).
// Replaced the old client-side JWT decoding (roleFromToken, since removed).
import { authRequest } from './client';
import type { Role } from '../../types/types';

// The backend returns the role in UPPERCASE (Prisma enum), nullable (floating user, i.e. no
// company yet).
export type BackendRole = 'ADMIN' | 'OWNER' | 'MANAGER' | 'EMPLOYEE';
export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Identity = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: BackendRole | null;                                   // null = floating user
  companyId: string | null;
  company: { id: string; name: string; status: CompanyStatus } | null;
  profilePhoto: string | null;                                // avatar key (av_1…av_6) or null
};

// Backend role (uppercase) → frontend Role (lowercase); null when floating.
export function normalizeRole(role: BackendRole | null): Role | null {
  return role ? (role.toLowerCase() as Role) : null;
}

// Short-lived cache: the root beforeLoad runs on every navigation (and on "intent" preload on
// hover), so without a cache /auth/me would be hammered. Explicitly invalidated on identity
// transitions (login/logout/dead session) via clearIdentityCache().
let cache: { identity: Identity | null; at: number } | null = null;
const TTL_MS = 30_000;

// authRequest handles 401 → refresh → retry: an F5 recovers the session from the cookie.
// No session → 401 after refresh → null identity (the app stays on the public home).
export async function getIdentity(): Promise<Identity | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.identity;
  const res = await authRequest<{ user: Identity }>('GET', '/auth/me');
  if (res.ok && res.data) {
    const identity = res.data.user;
    cache = { identity, at: Date.now() };
    return identity;
  }
  // 401 = genuinely no session → cache the null (fast and legitimate).
  // 429 / 5xx / network failure = TRANSIENT failure → do NOT cache, otherwise one blip
  // poisons the identity for TTL_MS and breaks the whole app.
  if (res.status === 401) cache = { identity: null, at: Date.now() };
  return null;
}

// Invalidates the cache on identity transitions (login/logout/dead session).
export function clearIdentityCache(): void {
  cache = null;
}
