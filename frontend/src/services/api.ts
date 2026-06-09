// Client API minimal pour parler au backend Prim'O.
// En dev, l'URL est relative (/api) et Vite la proxifie vers le backend

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

// (voir vite.config.js) → pas de souci CORS ni de port Windows/WSL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// POST générique : envoie du JSON, renvoie { ok, status, data }.
// On ne jette pas d'exception sur les erreurs HTTP : on renvoie le statut
// pour que les formulaires affichent le bon message (400, 404, 409...).
async function post(path: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // credentials: pour envoyer/recevoir le cookie refresh (httpOnly)
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Pas de corps JSON (ex. page d'erreur 404 d'Express) — on ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// GET : joint l'access token en Bearer s'il est fourni.
// Token optionnel pour les routes publiques (ex. vitrine des offres).
async function get(path: string, accessToken?: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Pas de corps JSON — on ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// DELETE authentifié.
async function del(path: string, accessToken: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // 204 No Content → pas de corps, normal.
  }

  return { ok: res.ok, status: res.status, data };
}

// POST authentifié : le token vient en argument (comme `get`), pas du
// localStorage — cette app garde l'accessToken dans le state React.
async function authPost(path: string, accessToken: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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

// DELETE authentifié avec corps JSON optionnel (désactivation d'offre).
async function authDelete(path: string, accessToken: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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

// PATCH authentifié : mise à jour partielle (édition d'offre).
async function authPatch(path: string, accessToken: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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

// Vitrine des offres partenaires. Token optionnel : public sur la landing,
// authentifié côté admin.
export function listOffers(token?: string) {
  return get('/offers', token) as Promise<{
    ok: boolean;
    status: number;
    data: { offers: Offer[] } | null;
  }>;
}

// Crée une offre (admin). isActive/id sont posés côté serveur.
export function createOffer(token: string, payload: Omit<Offer, 'id' | 'isActive'>) {
  return authPost('/offers', token, payload) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

// Met à jour une offre (admin).
export function updateOffer(token: string, offerId: string, payload: Partial<Omit<Offer, 'id'>>) {
  return authPatch(`/offers/${offerId}`, token, payload) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

// Désactive une offre (soft delete, admin).
export function deactivateOffer(token: string, offerId: string) {
  return authDelete(`/offers/${offerId}`, token) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

// Liste les employés de l'entreprise du manager connecté.
export function listEmployees(accessToken: string) {
  return get('/employees/list', accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: { employees: Employee[] } | null;
  }>;
}

// Solde du pool de tokens de l'entreprise du manager.
export function getCompany(accessToken: string) {
  return get('/company', accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: { company: Company } | null;
  }>;
}

// Historique des attributions de l'entreprise (récentes d'abord).
export function listAttributions(accessToken: string) {
  return get('/attributions', accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: { attributions: AttributionHistory[] } | null;
  }>;
}

// Supprime (soft delete) un employé de l'entreprise du manager.
export function deleteEmployee(accessToken: string, employeeId: string) {
  return del(`/employees/${employeeId}`, accessToken);
}

// Solde de l'employé connecté.
export function getEmployeeBalance(accessToken: string) {
  return get('/employees/me', accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: { balance: number } | null;
  }>;
}

// Historique paginé des tokens reçus.
export function getEmployeeReceived(accessToken: string, page = 1, limit = 10) {
  return get(`/employees/me/received?page=${page}&limit=${limit}`, accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: Paginated<ReceivedToken> | null;
  }>;
}

// Historique paginé des dépenses.
export function getEmployeeSpent(accessToken: string, page = 1, limit = 10) {
  return get(`/employees/me/spent?page=${page}&limit=${limit}`, accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: Paginated<SpentToken> | null;
  }>;
}

// Génère un code d'invitation (manager connecté).
// Aucun body : le code est créé côté serveur avec les défauts backend.
export function generateInviteCode(accessToken: string) {
  return authPost('/invites/generate', accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: { invite: { code: string; maxUses: number; expiresAt: string; createdAt: string } } | null;
  }>;
}

// Attribue des tokens à un employé (manager connecté).
// Le backend débite le pool entreprise et crédite l'employé de façon atomique.
export function createAttribution(
  accessToken: string,
  payload: { employeeId: string; amount: number; reason: string },
) {
  return authPost('/attributions', accessToken, payload) as Promise<{
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

// Refresh silencieux : au boot de l'app, échange le cookie refresh (httpOnly)
// contre un nouvel accessToken. Permet de rester connecté après un F5,
// l'accessToken n'étant gardé qu'en mémoire (state React).
export function refresh() {
  return post('/auth/refresh') as Promise<{
    ok: boolean;
    status: number;
    data: { accessToken: string } | null;
  }>;
}

// Déconnexion : révoque le refresh côté serveur et supprime le cookie.
export function logout() {
  return post('/auth/logout');
}
// Source de vérité du rôle = le payload du JWT (et non le sélecteur du formulaire).
// Le backend émet le rôle en MAJUSCULES (enum Prisma) → on repasse en minuscules.
export function roleFromToken(accessToken: string): Role {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  return String(payload.role).toLowerCase() as Role;
}

