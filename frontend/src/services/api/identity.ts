// Source de vérité d'identité : GET /auth/me (role + company.status, lus en DB).
// Remplace à terme le décodage JWT client (roleFromToken, tué en Phase B).
import { authRequest } from './client';
import type { Role } from '../../types/types';

// Le backend renvoie le rôle en MAJUSCULES (enum Prisma), nullable (user flottant).
export type BackendRole = 'ADMIN' | 'OWNER' | 'MANAGER' | 'EMPLOYEE';
export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Identity = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: BackendRole | null;                                   // null = flottant
  companyId: string | null;
  company: { id: string; name: string; status: CompanyStatus } | null;
};

// Rôle backend (MAJ) → Role front (min). null si flottant.
export function normalizeRole(role: BackendRole | null): Role | null {
  return role ? (role.toLowerCase() as Role) : null;
}

// Cache court : beforeLoad racine s'exécute à chaque navigation (et au preload
// "intent" au survol) → sans cache, /auth/me serait spammé. Invalidé explicitement
// aux transitions d'identité (login/logout/session morte) via clearIdentityCache().
let cache: { identity: Identity | null; at: number } | null = null;
const TTL_MS = 30_000;

// authRequest gère 401→refresh→retry : un F5 récupère la session via le cookie.
// Pas de session → 401 après refresh → identity null (l'app reste sur l'accueil).
export async function getIdentity(): Promise<Identity | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.identity;
  const res = await authRequest<{ user: Identity }>('GET', '/auth/me');
  const identity = res.ok && res.data ? res.data.user : null;
  cache = { identity, at: Date.now() };
  return identity;
}

// Invalide le cache aux transitions d'identité (login/logout/session morte).
export function clearIdentityCache(): void {
  cache = null;
}
