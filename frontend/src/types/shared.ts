// Types transverses (auth, enveloppe API, pagination).

// Rôle utilisateur - valeurs alignées sur l'enum Prisma backend (MANAGER, EMPLOYEE, OWNER, ADMIN),
// en minuscules. Le rôle vient du JWT renvoyé au login.
export type Role = 'manager' | 'employee' | 'owner' | 'admin';

// Mode du formulaire d'auth.
export type Mode = 'login' | 'register';

// Réponse paginée générique des historiques.
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  hasMore: boolean;
};
