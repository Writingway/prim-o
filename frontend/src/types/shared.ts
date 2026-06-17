// Types transverses (auth, enveloppe API, pagination).

// Rôle utilisateur — valeurs alignées sur l'enum Prisma backend (MANAGER, EMPLOYEE, ADMIN),
// en minuscules. Le rôle vient du JWT renvoyé au login.
export type Role = 'manager' | 'employee' | 'admin';

// Mode du formulaire d'auth.
export type Mode = 'login' | 'register';

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

// Session renvoyée après une connexion réussie.
export type AuthSession = {
  accessToken: string;
  role: Role;
};

// Réponse paginée générique des historiques.
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  hasMore: boolean;
};
