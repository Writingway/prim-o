// GDPR - the logged-in user's personal data (art. 15, 16, 17, 20).
// Reuses the authenticated transport from client.ts (401 → refresh → retry).
import { authRequest } from './client';

type MyProfile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isEmailVerified: boolean;
  profilePhoto: string | null;
};

// Export of all my data (art. 15 & 20). The backend returns JSON; the component turns it into
// a downloadable file.
export function exportMyData() {
  return authRequest<Record<string, unknown>>('GET', '/me/export');
}

// Account deletion (anonymization), confirmed by password (art. 17).
// Expects 204 on success; 401 when the password is wrong.
export function deleteMyAccount(password: string) {
  return authRequest('DELETE', '/me', { password });
}

// Current profile (pre-fills the rectification form).
export function getMyProfile() {
  return authRequest<{ profile: MyProfile }>('GET', '/me');
}

// Profile rectification (art. 16). Send only the fields that changed.
export function updateMyProfile(payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhoto?: string | null;
}) {
  return authRequest<{ profile: MyProfile } | { error: string }>('PATCH', '/me', payload);
}
