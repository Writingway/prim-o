// Client API minimal pour parler au backend Prim'O.
// En dev, l'URL est relative (/api) et Vite la proxifie vers le backend

import { Role, Employee } from "../types/types";
import { Offer } from "../types/types";

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

// GET authentifié : joint l'access token en Bearer.
async function get(path: string, accessToken: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
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

export function listOffers(token: string) {
  return get('/offers', token) as Promise<{
    ok: boolean;
    status: number;
    data: { offers: Offer[] } | null;
  }>;
}

export function createOffer(token: string, payload: Omit<Offer, 'id' | 'isActive'> ) {
  return authPost('/offers', token, payload) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

export function updateOffer(token: string, offerId: string, payload: Partial<Omit<Offer, 'id'>> ) {
  return authPatch(`/offers/${offerId}`, token, payload) as Promise<{
    ok: boolean;
    status: number;
    data: { offer: Offer } | null;
  }>;
}

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

// Génère un code d'invitation (manager connecté).
// Aucun body : le code est créé côté serveur avec les défauts backend.
export function generateInviteCode(accessToken: string) {
  return authPost('/invites/generate', accessToken) as Promise<{
    ok: boolean;
    status: number;
    data: { invite: { code: string; maxUses: number; expiresAt: string; createdAt: string } } | null;
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
export function roleFromToken(accessToken: string): Role {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  return String(payload.role).toLowerCase() as Role;
}

