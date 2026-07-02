// Global stats for the admin dashboard (GET /api/admin/stats).
export type AdminStats = {
  companies: number;
  users: number;
  managers: number;
};

// Admin-side role/status: UPPERCASE Prisma enum values (unlike the lowercase JWT `Role`).
export type AdminRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type AdminStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// User as returned by GET /api/admin/users (backend ADMIN_SAFE_SELECT — never exposes
// passwordHash).
export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  firstName: string;
  lastName: string;
  balance: number;
  isEmailVerified: boolean;
  companyId: string | null;
  createdAt: string;
};

// Company as seen by the admin (GET /api/admin/companies), including its user count.
export type AdminCompany = {
  id: string;
  name: string;
  tokenBalance: number;
  status: AdminStatus;
  createdAt: string;
  _count: { users: number };
};

// Row of the global attributions register (GET /api/admin/attributions).
export type AdminAttribution = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  company: { name: string };
  manager: { firstName: string; lastName: string };
  employee: { firstName: string; lastName: string };
};

// Row of the global redemptions register (GET /api/admin/redemptions).
export type AdminRedemption = {
  id: string;
  amount: number;
  createdAt: string;
  company: { name: string };
  employee: { firstName: string; lastName: string };
  offer: { partnerName: string };
  promoCode: { code: string };
};

// Row of the global Stripe payments register (GET /api/admin/purchases).
// Sourced from CompanyTokenPurchase filtered on stripeSessionId != null.
export type AdminPurchase = {
  id: string;
  amount: number;
  note: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  company: { name: string };
  createdBy: { firstName: string; lastName: string };
};
