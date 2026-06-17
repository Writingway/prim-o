// Client API minimal pour parler au backend Prim'O.
// En dev, l'URL est relative (/api) et Vite la proxifie vers le backend
// (voir vite.config.js) → pas de souci CORS ni de port Windows/WSL.

import {
  Role,
  Employee,
  ReceivedToken,
  Company,
  AttributionHistory,
  Paginated,
  SpentToken,
  Offer,
} from "../types/types";

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Propriété du token ──────────────────────────────────────────
// api.ts est propriétaire de l'accessToken (en mémoire uniquement,
// jamais en localStorage). App le pose au login, refresh() le
// renouvelle silencieusement, et les composants ne le trimballent
// plus en props.

let currentToken: string | null = null;

export function setAccessToken(token: string | null): void {
  currentToken = token;
}

// App enregistre ici quoi faire quand la session est définitivement
// morte (refresh impossible) : setSession(null) → écran de connexion.
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpired(cb: () => void): void {
  onSessionExpired = cb;
}

type ApiResult = { ok: boolean; status: number; data: any };

// Requête brute : pose le Bearer si un token est en mémoire.
// On ne jette pas d'exception sur les erreurs HTTP : on renvoie le statut
// pour que les formulaires affichent le bon message (400, 404, 409...).
async function rawRequest(method: string, path: string, body?: unknown): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    // credentials : pour envoyer/recevoir le cookie refresh (httpOnly)
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Pas de corps JSON (204, page d'erreur...) — on ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// POST public (login, register, refresh, logout) : pas de Bearer, pas de
// retry — un 401 ici est une vraie réponse métier, pas un token expiré.
async function post(path: string, body?: unknown): Promise<ApiResult> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Pas de corps JSON — on ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// ─── Refresh singleton ───────────────────────────────────────────
// Une seule requête refresh en vol à la fois : les appelants concurrents
// (StrictMode, wrapper 401, plusieurs appels parallèles) partagent la
// même promesse. Sans ça, le second appel présenterait un token déjà
// tourné → détection de vol côté serveur → famille révoquée → déco.

let refreshPromise: Promise<ApiResult> | null = null;

export function refresh(): Promise<{
  ok: boolean;
  status: number;
  data: { accessToken: string } | null;
}> {
  if (!refreshPromise) {
    refreshPromise = post('/auth/refresh')
      .then((res) => {
        if (res.ok && res.data?.accessToken) {
          currentToken = res.data.accessToken; // renouvellement silencieux
        }
        return res;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ─── Wrapper authentifié : 401 → refresh → retry (UNE fois) ──────
async function authRequest(method: string, path: string, body?: unknown): Promise<ApiResult> {
  const first = await rawRequest(method, path, body);
  if (first.status !== 401) return first;

  // Access token expiré ? Un seul refresh silencieux, partagé.
  const r = await refresh();
  if (!r.ok || !r.data?.accessToken) {
    // Refresh mort (cookie expiré/révoqué) : la session est terminée.
    setAccessToken(null);
    onSessionExpired?.();
    return first;
  }

  // Retry UNIQUE avec le token frais. Jamais de second retry : un 401
  // ici est une vraie interdiction, pas une expiration.
  const second = await rawRequest(method, path, body);
  if (second.status === 401) {
    setAccessToken(null);
    onSessionExpired?.();
  }
  return second;
}

// Vitrine des offres partenaires. Public sur la landing (pas de token
// en mémoire → pas de Bearer), authentifié côté admin.
export function listOffers() {
  return authRequest('GET', '/offers') as Promise<{
    ok: boolean;
    status: number;
    data: { offers: Offer[] } | null;
  }>;
}

// Crée une offre (admin). isActive/id sont posés côté serveur.
export function createOffer(payload: Omit<Offer, 'id' | 'isActive'>) {
  return authRequest('POST', '/admin/offers', payload) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

// Met à jour une offre (admin).
export function updateOffer(offerId: string, payload: Partial<Omit<Offer, 'id'>>) {
  return authRequest('PATCH', `/admin/offers/${offerId}`, payload) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

// Désactive une offre (soft delete, admin).
export function deactivateOffer(offerId: string) {
  return authRequest('DELETE', `/admin/offers/${offerId}`) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

// Liste les employés de l'entreprise du manager connecté.
export function listEmployees() {
  return authRequest('GET', '/employees/list') as Promise<{
    ok: boolean;
    status: number;
    data: { employees: Employee[] } | null;
  }>;
}

// Solde du pool de tokens de l'entreprise du manager.
export function getCompany() {
  return authRequest('GET', '/company') as Promise<{
    ok: boolean;
    status: number;
    data: { company: Company } | null;
  }>;
}

// Historique des attributions de l'entreprise (récentes d'abord).
export function listAttributions() {
  return authRequest('GET', '/attributions') as Promise<{
    ok: boolean;
    status: number;
    data: { attributions: AttributionHistory[] } | null;
  }>;
}

// Supprime (soft delete) un employé de l'entreprise du manager.
export function deleteEmployee(employeeId: string) {
  return authRequest('DELETE', `/employees/${employeeId}`);
}

// Approuve un employé en attente (manager connecté).
export function approveEmployee(employeeId: string) {
  return authRequest('PATCH', `/employees/${employeeId}/approve`);
}

// Solde de l'employé connecté.
export function getEmployeeBalance() {
  return authRequest('GET', '/employees/me') as Promise<{
    ok: boolean;
    status: number;
    data: { balance: number } | null;
  }>;
}

// Historique paginé des tokens reçus.
export function getEmployeeReceived(page = 1, limit = 10) {
  return authRequest('GET', `/employees/me/received?page=${page}&limit=${limit}`) as Promise<{
    ok: boolean;
    status: number;
    data: Paginated<ReceivedToken> | null;
  }>;
}

// Historique paginé des dépenses.
export function getEmployeeSpent(page = 1, limit = 10) {
  return authRequest('GET', `/employees/me/spent?page=${page}&limit=${limit}`) as Promise<{
    ok: boolean;
    status: number;
    data: Paginated<SpentToken> | null;
  }>;
}

// ─── RGPD : données personnelles de l'utilisateur connecté ───────

// Export de toutes mes données (art. 15 & 20). Le backend renvoie un JSON ;
// c'est le composant qui en fait un fichier téléchargeable (étape 2).
export function exportMyData() {
  return authRequest('GET', '/me/export') as Promise<{
    ok: boolean;
    status: number;
    data: Record<string, unknown> | null;
  }>;
}

// Suppression (anonymisation) de mon compte, confirmée par mot de passe (art. 17).
// 204 attendu en succès ; 401 si le mot de passe est incorrect.
export function deleteMyAccount(password: string) {
  return authRequest('DELETE', '/me', { password });
}

// Génère un code d'invitation (manager connecté).
// Aucun body : le code est créé côté serveur avec les défauts backend.
export function generateInviteCode() {
  return authRequest('POST', '/invites/generate') as Promise<{
    ok: boolean;
    status: number;
    data: { invite: { code: string; maxUses: number; expiresAt: string; createdAt: string } } | null;
  }>;
}

// Attribue des tokens à un employé (manager connecté).
// Le backend débite le pool entreprise et crédite l'employé de façon atomique.
export function createAttribution(
  payload: { employeeId: string; amount: number; reason: string },
) {
  return authRequest('POST', '/attributions', payload) as Promise<{
    ok: boolean;
    status: number;
    data: { attribution: { id: string; amount: number; reason: string; createdAt: string } } | { error: string } | null;
  }>;
}

export function registerManager(payload: { companyName: string; firstName: string; lastName: string; email: string; password: string }) {
  return post('/auth/manager/register', payload);
}

export function registerEmployee(payload: { firstName: string; lastName: string; email: string; password: string; code: string }) {
  return post('/auth/employee/register', payload);
}

// Login unifié : le backend identifie le rôle via les identifiants, plus via l'URL.
// La réponse ne contient que { accessToken } ; le rôle se lit dans le JWT.
export function login(payload: { email: string; password: string }) {
  return post('/auth/login', payload);
}

// Déconnexion : révoque le refresh côté serveur et supprime le cookie.
export function logout() {
  return post('/auth/logout');
}

// Source de vérité du rôle = le payload du JWT (et non le sélecteur du formulaire).
// Le backend émet le rôle en MAJUSCULES (enum Prisma) → on repasse en minuscules.
export function roleFromToken(accessToken: string): Role | null {
  try {
    const b64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64));
    return String(payload.role).toLowerCase() as Role;
  } catch {
    return null;
  }
}
