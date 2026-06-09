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

// Employé tel que renvoyé par GET /api/employees/list.
export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  balance: number;
  isEmailVerified: boolean;
  createdAt: string;
};

// Entreprise du manager (GET /api/company).
export type Company = {
  id: string;
  name: string;
  tokenBalance: number;
};

// Une ligne d'historique d'attribution (GET /api/attributions).
export type AttributionHistory = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  employee: { firstName: string; lastName: string };
};