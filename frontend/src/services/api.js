// Client API minimal pour parler au backend Prim'O.
// En dev, l'URL est relative (/api) et Vite la proxifie vers le backend
// (voir vite.config.js) → pas de souci CORS ni de port Windows/WSL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// POST générique : envoie du JSON, renvoie { ok, status, data }.
// On ne jette pas d'exception sur les erreurs HTTP : on renvoie le statut
// pour que les formulaires affichent le bon message (400, 404, 409...).
async function post(path, body) {
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

export function registerEmployer(payload) {
  return post('/auth/employer/register', payload);
}

export function registerEmployee(payload) {
  return post('/auth/employee/register', payload);
}

// role : 'employer' | 'employee'
export function login(role, payload) {
  return post(`/auth/${role}/login`, payload);
}

// Déconnexion : révoque le refresh côté serveur et supprime le cookie.
export function logout() {
  return post('/auth/logout');
}
