// Client API minimal pour parler au backend Prim'O.
// En dev, l'URL est relative (/api) et Vite la proxifie vers le backend

import { Role } from "../types/types";

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

export function registerManager(payload: { companyName: string; email: string; password: string }) {
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

// Source de vérité du rôle = le payload du JWT (et non le sélecteur du formulaire).
// Le backend émet le rôle en MAJUSCULES (enum Prisma) → on repasse en minuscules.
export function roleFromToken(accessToken: string): Role {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  return String(payload.role).toLowerCase() as Role;
}

// Déconnexion : révoque le refresh côté serveur et supprime le cookie.
export function logout() {
  return post('/auth/logout');
}
