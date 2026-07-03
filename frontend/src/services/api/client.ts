// Core transport: token ownership, refresh singleton, request wrappers.
// In dev the URL is relative (/api) and Vite proxies it to the backend (see vite.config.js),
// which avoids CORS issues and Windows/WSL port juggling.

const API_URL = import.meta.env.VITE_API_URL || '/api';

export type ApiResult<T = unknown> = { ok: boolean; status: number; data: T | null };

// Builds the URL of an asset (e.g. an offer photo). An absolute URL (external image, e.g.
// Unsplash seed data) is returned as-is; a relative "/uploads/…" path (admin upload) is
// prefixed with the API origin (proxied by Vite in dev).
export function assetUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

// Token ownership: client.ts owns the access token, in memory only - never in localStorage.
// App sets it at login, refresh() renews it silently, and components never carry it around.

let currentToken: string | null = null;

export function setAccessToken(token: string | null): void {
  currentToken = token;
}

// App registers here what to do when the session is dead for good (refresh impossible):
// setSession(null) → login screen.
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpired(cb: () => void): void {
  onSessionExpired = cb;
}

// Raw request: attaches the Bearer header when a token is in memory.
// HTTP errors do not throw; the status is returned so forms can show the right
// message (400, 404, 409...).
async function rawRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  // FormData (file upload): do NOT set Content-Type - the browser generates
  // "multipart/form-data; boundary=…" itself.
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    // credentials: send/receive the httpOnly refresh cookie.
    credentials: 'include',
    // no-store: otherwise the browser revalidates GETs (If-None-Match) and the backend answers
    // 304 with no body → res.ok=false, data=null → spurious "failed to load" errors. We always
    // want a fresh 200 + body on an authenticated API.
    cache: 'no-store',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  let data: T | null = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (204, error page...) - ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// Public POST (login, register, refresh, logout): no Bearer, no retry - a 401 here is a real
// business response, not an expired token.
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
    // No JSON body - ignore.
  }

  return { ok: res.ok, status: res.status, data };
}

// Refresh singleton: only one refresh request in flight at a time - concurrent callers
// (StrictMode, the 401 wrapper, parallel calls) share the same promise. Without this, a second
// call would present an already-rotated token → server-side theft detection → token family
// revoked → user logged out.

let refreshPromise: Promise<ApiResult<{ accessToken: string }>> | null = null;

export function refresh(): Promise<ApiResult<{ accessToken: string }>> {
  if (!refreshPromise) {
    refreshPromise = post<{ accessToken: string }>('/auth/refresh')
      .then((res) => {
        if (res.ok && res.data?.accessToken) {
          currentToken = res.data.accessToken; // silent renewal
        }
        return res;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Authenticated wrapper: 401 → refresh → retry (exactly once).
export async function authRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const first = await rawRequest<T>(method, path, body);
  if (first.status !== 401) return first;

  // Access token expired? One shared silent refresh.
  const r = await refresh();
  if (!r.ok || !r.data?.accessToken) {
    // Only log out when the refresh is rejected for an auth reason (401/403 = cookie
    // expired/revoked). A 429 (rate limit), a 5xx or a network failure does NOT mean the session
    // is dead - otherwise a burst of requests (StrictMode, fast navigation) exceeds the quota,
    // the refresh gets a 429 and the user is logged out for no reason.
    if (r.status === 401 || r.status === 403) {
      setAccessToken(null);
      onSessionExpired?.();
    }
    return first;
  }

  // Single retry with the fresh token. Never a second retry: a 401 here is a real denial,
  // not an expiration.
  const second = await rawRequest<T>(method, path, body);
  if (second.status === 401) {
    setAccessToken(null);
    onSessionExpired?.();
  }
  return second;
}
