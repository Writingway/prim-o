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

// Offre telle que renvoyée par les endpoints d'offres.
export type OfferCategory = 'FOOD' | 'SHOPPING' | 'CULTURE' | 'TRAVEL' | 'WELLNESS' | 'OTHER';

export type Offer = {
  id: string;
  partnerName: string;
  cost: number;
  discountPercent: number;
  category: OfferCategory;
  isActive: boolean;
};
