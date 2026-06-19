import { Role } from "../../types/types";
import { post } from "./client";

// Corps d'erreur de validation (400) : le backend renvoie details[].message.
type ValidationErrorBody = { details?: Array<{ message: string }> };

export function registerCompany(payload: { companyName: string; firstName: string; lastName: string; email: string; password: string }) {
  return post<ValidationErrorBody>('/auth/register-company', payload);
}

export function registerEmployee(payload: { firstName: string; lastName: string; email: string; password: string; code: string }) {
  return post<ValidationErrorBody>('/auth/register-user', payload);
}

// Login unifié : le backend identifie le rôle via les identifiants, pas via l'URL.
// Succès → { accessToken } ; le rôle se lit dans le JWT. Erreur 403 → { error }.
export function login(payload: { email: string; password: string }) {
  return post<{ accessToken: string; error?: string; code?: string }>('/auth/login', payload);
}

// Renvoi de l'email de vérification (réponse toujours générique côté back).
export function resendVerification(email: string) {
  return post<{ message?: string }>('/auth/resend-verification', { email });
}

// Mot de passe oublié : déclenche l'envoi du lien de reset (réponse générique).
export function forgotPassword(email: string) {
  return post<{ message?: string }>('/auth/forgot-password', { email });
}

// Reset : consomme le token reçu par mail et fixe le nouveau mot de passe.
export function resetPassword(token: string, password: string) {
  return post<{ message?: string; error?: string; code?: string }>('/auth/reset-password', { token, password });
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
