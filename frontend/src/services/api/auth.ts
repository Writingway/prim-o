import { authRequest, post } from "./client";

// Validation error body (400): the backend returns details[].message.
type ValidationErrorBody = { details?: Array<{ message: string }> };

// Creates the user's company (authenticated floating user → OWNER, company PENDING,
// fresh token).
export function createCompany(payload: { companyName: string }) {
  return authRequest<{ company: { id: string; name: string; status: string }; accessToken: string } & ValidationErrorBody>(
    'POST', '/auth/create-company', payload,
  );
}

// Joins a company via an invite code (immediately an active member, fresh token).
export function joinCompany(payload: { code: string }) {
  return authRequest<{ accessToken: string } & ValidationErrorBody>('POST', '/auth/join-company', payload);
}

// Unified login: the backend derives the role from the credentials, not from the URL.
// Success → { accessToken }; the role is read from the JWT. A 403 carries { error }.
export function login(payload: { email: string; password: string }) {
  return post<{ accessToken: string; error?: string; code?: string }>('/auth/login', payload);
}

// Resends the verification email (the backend always answers generically).
export function resendVerification(email: string) {
  return post<{ message?: string }>('/auth/resend-verification', { email });
}

// Forgot password: triggers the reset-link email (generic response).
export function forgotPassword(email: string) {
  return post<{ message?: string }>('/auth/forgot-password', { email });
}

// Reset: consumes the token received by email and sets the new password.
export function resetPassword(token: string, password: string) {
  return post<{ message?: string; error?: string; code?: string }>('/auth/reset-password', { token, password });
}

// Logout: revokes the refresh token server-side and clears the cookie.
export function logout() {
  return post('/auth/logout');
}
  
// Account-first flow: registration creates a floating user (no company yet) and auto-logs in
// (cookie + accessToken).
export function register(payload: { firstName: string; lastName: string; email: string; password: string }) {
  return post<{ message?: string } & ValidationErrorBody>('/auth/register', payload);
}

