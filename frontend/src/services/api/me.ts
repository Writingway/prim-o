// RGPD - données personnelles de l'utilisateur connecté (art. 15, 16, 17, 20).
// Réutilise le transport authentifié de client.ts (401 → refresh → retry).
import { authRequest } from './client';

type MyProfile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isEmailVerified: boolean;
};

// Export de toutes mes données (art. 15 & 20). Le backend renvoie un JSON ;
// le composant en fait un fichier téléchargeable.
export function exportMyData() {
  return authRequest<Record<string, unknown>>('GET', '/me/export');
}

// Suppression (anonymisation) de mon compte, confirmée par mot de passe (art. 17).
// 204 attendu en succès ; 401 si le mot de passe est incorrect.
export function deleteMyAccount(password: string) {
  return authRequest('DELETE', '/me', { password });
}

// Profil courant (pré-remplit la rectification).
export function getMyProfile() {
  return authRequest<{ profile: MyProfile }>('GET', '/me');
}

// Rectification du profil (art. 16). N'envoie que les champs modifiés.
export function updateMyProfile(payload: { firstName?: string; lastName?: string; email?: string }) {
  return authRequest<{ profile: MyProfile } | { error: string }>('PATCH', '/me', payload);
}
