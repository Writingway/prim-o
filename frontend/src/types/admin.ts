// Stats globales du tableau de bord admin (GET /api/admin/stats).
export type AdminStats = {
  companies: number;
  users: number;
  managers: number;
};

// Rôle / statut côté admin - enums Prisma en MAJUSCULES (≠ Role JWT minuscule).
export type AdminRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type AdminStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Utilisateur renvoyé par GET /api/admin/users (ADMIN_SAFE_SELECT backend,
// jamais de passwordHash).
export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  firstName: string;
  lastName: string;
  balance: number;
  isEmailVerified: boolean;
  companyId: string | null;
  createdAt: string;
};

// Entreprise vue admin (GET /api/admin/companies) - avec nb d'utilisateurs.
export type AdminCompany = {
  id: string;
  name: string;
  tokenBalance: number;
  status: AdminStatus;
  createdAt: string;
  _count: { users: number };
};

// Ligne du registre global d'attributions (GET /api/admin/attributions).
export type AdminAttribution = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  company: { name: string };
  manager: { firstName: string; lastName: string };
  employee: { firstName: string; lastName: string };
};

// Ligne du registre global de redemptions (GET /api/admin/redemptions).
export type AdminRedemption = {
  id: string;
  amount: number;
  createdAt: string;
  company: { name: string };
  employee: { firstName: string; lastName: string };
  offer: { partnerName: string };
  promoCode: { code: string };
};

// Ligne du registre global des paiements Stripe (GET /api/admin/purchases).
// Source : CompanyTokenPurchase filtré sur stripeSessionId != null.
export type AdminPurchase = {
  id: string;
  amount: number;
  note: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  company: { name: string };
  createdBy: { firstName: string; lastName: string };
};
