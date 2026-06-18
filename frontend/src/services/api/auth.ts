import { authRequest, post } from "./client";

// Corps d'erreur de validation (400) : le backend renvoie details[].message.
type ValidationErrorBody = { details?: Array<{ message: string }> };

// Créer son entreprise (flottant authentifié → OWNER, Company PENDING, token frais).
export function createCompany(payload: { companyName: string }) {
  return authRequest<{ company: { id: string; name: string; status: string }; accessToken: string } & ValidationErrorBody>(
    'POST', '/auth/create-company', payload,
  );
}

// Rejoindre une entreprise via code (membre actif direct, token frais).
export function joinCompany(payload: { code: string }) {
  return authRequest<{ accessToken: string } & ValidationErrorBody>('POST', '/auth/join-company', payload);
}

// Login unifié : le backend identifie le rôle via les identifiants, pas via l'URL.
// Succès → { accessToken } ; le rôle se lit dans le JWT. Erreur 403 → { error }.
export function login(payload: { email: string; password: string }) {
  return post<{ accessToken: string; error?: string }>('/auth/login', payload);
}

// Déconnexion : révoque le refresh côté serveur et supprime le cookie.
export function logout() {
  return post('/auth/logout');
}
  
// Account-first : inscription = utilisateur flottant, auto-login (cookie + accessToken).
export function register(payload: { firstName: string; lastName: string; email: string; password: string }) {
  return post<{ accessToken: string } & ValidationErrorBody>('/auth/register', payload);
}

