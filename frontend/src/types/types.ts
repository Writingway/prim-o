// Rôle utilisateur — DOIT matcher les segments d'URL backend (/auth/manager, /auth/employee).
export type Role = 'manager' | 'employee';

// Mode du formulaire d'auth.
export type Mode = 'login' | 'register';

// Session renvoyée après une connexion réussie.
export type AuthSession = {
  accessToken: string;
  role: Role;
};