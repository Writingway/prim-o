// Cross-cutting types (auth, pagination).

// User role: lowercase counterparts of the backend Prisma enum (MANAGER, EMPLOYEE, OWNER, ADMIN).
// The role comes from the JWT returned at login.
export type Role = 'manager' | 'employee' | 'owner' | 'admin';

// Auth form mode.
export type Mode = 'login' | 'register';

// Generic paginated response used by the history endpoints.
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  hasMore: boolean;
};
