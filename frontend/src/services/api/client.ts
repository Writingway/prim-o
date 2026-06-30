// Core transport: token ownership, refresh singleton, request wrappers.
// En dev l'URL est relative (/api), Vite proxifie vers le backend
// (voir vite.config.js) → pas de souci CORS ni de port Windows/WSL.

const API_URL = import.meta.env.VITE_API_URL || '/api';

export type ApiResult<T = unknown> = { ok: boolean; status: number; data: T | null };

// Construit l'URL d'un asset servi par le backend (ex. photo d'offre).
// Le backend renvoie un chemin relatif « /uploads/… » ; on le préfixe par
// l'origine de l'API (proxifiée par Vite en dev).
export function assetUrl(path: string): string {
  return `${API_URL}${path}`;
}

// ─── Propriété du token ──────────────────────────────────────────
// client.ts est propriétaire de l'accessToken (en mémoire uniquement,
// jamais en localStorage). App le pose au login, refresh() le
// renouvelle silencieusement, et les composants ne le trimballent plus.

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

// Requête brute : pose le Bearer si un token est en mémoire.
// On ne jette pas d'exception sur les erreurs HTTP : on renvoie le statut
// pour que les formulaires affichent le bon message (400, 404, 409...).
async function rawRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  // FormData (upload de fichier) : on NE pose PAS de Content-Type, le navigateur
  // génère « multipart/form-data; boundary=… » lui-même.
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    // credentials : pour envoyer/recevoir le cookie refresh (httpOnly)
    credentials: 'include',
    // no-store : sinon le navigateur revalide les GET (If-None-Match) et le
    // backend répond 304 sans corps → res.ok=false, data=null → faux "Impossible
    // de charger". On veut toujours un 200 + corps frais sur une API authentifiée.
    cache: 'no-store',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  let data: T | null = null;
  try {
    data = await res.json();
  } catch {
    // Pas de corps JSON (204, page d'erreur...) - on ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// POST public (login, register, refresh, logout) : pas de Bearer, pas de
// retry - un 401 ici est une vraie réponse métier, pas un token expiré.
export async function post<T = unknown>(path: string, body?: unknown): Promise<ApiResult<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data: T | null = null;
  try {
    data = await res.json();
  } catch {
    // Pas de corps JSON - on ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// ─── Refresh singleton ───────────────────────────────────────────
// Une seule requête refresh en vol à la fois : les appelants concurrents
// (StrictMode, wrapper 401, plusieurs appels parallèles) partagent la
// même promesse. Sans ça, le second appel présenterait un token déjà
// tourné → détection de vol côté serveur → famille révoquée → déco.

let refreshPromise: Promise<ApiResult<{ accessToken: string }>> | null = null;

export function refresh(): Promise<ApiResult<{ accessToken: string }>> {
  if (!refreshPromise) {
    refreshPromise = post<{ accessToken: string }>('/auth/refresh')
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
export async function authRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const first = await rawRequest<T>(method, path, body);
  if (first.status !== 401) return first;

  // Access token expiré ? Un seul refresh silencieux, partagé.
  const r = await refresh();
  if (!r.ok || !r.data?.accessToken) {
    // On ne déconnecte QUE si le refresh est refusé pour une raison d'auth
    // (401/403 = cookie expiré/révoqué). Un 429 (rate limit), un 5xx ou une
    // coupure réseau ne veulent PAS dire « session morte » → sinon une rafale
    // de requêtes (StrictMode, navigation rapide) dépasse le quota, le refresh
    // prend un 429 et l'utilisateur est déconnecté à tort.
    if (r.status === 401 || r.status === 403) {
      setAccessToken(null);
      onSessionExpired?.();
    }
    return first;
  }

  // Retry UNIQUE avec le token frais. Jamais de second retry : un 401
  // ici est une vraie interdiction, pas une expiration.
  const second = await rawRequest<T>(method, path, body);
  if (second.status === 401) {
    setAccessToken(null);
    onSessionExpired?.();
  }
  return second;
}
