import {
  Paginated,
  AdminStats,
  AdminUser,
  AdminRole,
  AdminStatus,
  AdminCompany,
  AdminAttribution,
  AdminRedemption,
  AdminPurchase
} from "../../types/types";
import { authRequest } from "./client";

// Global admin dashboard stats (not scoped to a company).
export const getAdminStats = () => authRequest<AdminStats>('GET', '/admin/stats');

export const listAdminUsers = (params: {
  page?: number;
  limit?: number;
  role?: AdminRole;
  status?: AdminStatus;
  companyId?: string;
  search?: string;
} = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const qs = q.toString();
  return authRequest<Paginated<AdminUser>>('GET', `/admin/users${qs ? `?${qs}` : ''}`);
};

// Updates a user's role/status (admin). The backend forbids granting ADMIN, and blocks
// self-modification and touching the last admin.
export const updateAdminUser = (
  id: string,
  payload: { role?: 'MANAGER' | 'EMPLOYEE'; isEmailVerified?: boolean },
) => authRequest<{ user: AdminUser }>('PATCH', `/admin/users/${id}`, payload);

// Soft delete of a user (admin).
export const deleteAdminUser = (id: string) =>
  authRequest<{ id: string }>('DELETE', `/admin/users/${id}`);

export const listAdminCompanies = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminCompany>>('GET', `/admin/companies?page=${page}&limit=${limit}`);

export const createAdminCompany = (name: string) =>
  authRequest<{ company: AdminCompany }>('POST', '/admin/companies', { name });

// Approves or rejects a pending company (PENDING → APPROVED/REJECTED).
export const setCompanyStatus = (id: string, status: 'APPROVED' | 'REJECTED') =>
  authRequest<{ company: AdminCompany }>('PATCH', `/admin/companies/${id}/status`, { status });

// Cascading soft delete (users + sessions + invites). Returns the number of users affected.
export const deleteAdminCompany = (id: string) =>
  authRequest<{ companyId: string; usersDeleted: number }>('DELETE', `/admin/companies/${id}`);

// Restores a soft-deleted company (and the users removed by the delete cascade).
export const restoreAdminCompany = (id: string) =>
  authRequest<{ companyId: string; usersRestored: number }>('POST', `/admin/companies/${id}/restore`);

export const listAdminAttributions = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminAttribution>>('GET', `/admin/attributions?page=${page}&limit=${limit}`);

export const listAdminRedemptions = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminRedemption>>('GET', `/admin/redemptions?page=${page}&limit=${limit}`);

export const listAdminPurchases = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminPurchase>>('GET', `/admin/purchases?page=${page}&limit=${limit}`);
