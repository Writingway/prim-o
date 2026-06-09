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

// Un token reçu (attribution du manager), renvoyé par GET /api/employees/me/received.
export type ReceivedToken = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  managerName: string;
};

// Un token dépensé (redemption contre une offre), GET /api/employees/me/spent.
export type SpentToken = {
  id: string;
  amount: number;
  offerName: string;
  promoCode: string;
  createdAt: string;
};

// Réponse paginée générique des historiques.
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  hasMore: boolean;
};
