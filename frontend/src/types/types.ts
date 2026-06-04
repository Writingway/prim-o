// Rôle utilisateur — valeurs alignées sur l'enum Prisma backend (MANAGER, EMPLOYEE, ADMIN),
// en minuscules. Le rôle vient du JWT renvoyé au login.
export type Role = 'manager' | 'employee' | 'admin';

// Mode du formulaire d'auth.
export type Mode = 'login' | 'register';

// Session renvoyée après une connexion réussie.
export type AuthSession = {
  accessToken: string;
  role: Role;
};