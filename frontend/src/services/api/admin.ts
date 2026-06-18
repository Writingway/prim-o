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

// Stats globales du tableau de bord admin (non scopées à une entreprise).
export const getAdminStats = () => authRequest<AdminStats>('GET', '/admin/stats');

// Liste paginée + filtrée des utilisateurs (admin).
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

// Met à jour rôle/statut d'un utilisateur (admin). Le backend interdit ADMIN,
// bloque l'auto-modification et le dernier admin.
export const updateAdminUser = (
  id: string,
  payload: { role?: 'MANAGER' | 'EMPLOYEE'; status?: 'APPROVED' | 'REJECTED' },
) => authRequest<{ user: AdminUser }>('PATCH', `/admin/users/${id}`, payload);

// Soft-delete d'un utilisateur (admin).
export const deleteAdminUser = (id: string) =>
  authRequest<{ id: string }>('DELETE', `/admin/users/${id}`);

// ─── Entreprises (admin) ─────────────────────────────────────────
export const listAdminCompanies = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminCompany>>('GET', `/admin/companies?page=${page}&limit=${limit}`);

export const createAdminCompany = (name: string) =>
  authRequest<{ company: AdminCompany }>('POST', '/admin/companies', { name });

// Soft-delete en cascade (users + sessions + invites). Renvoie le nb d'users touchés.
export const deleteAdminCompany = (id: string) =>
  authRequest<{ companyId: string; usersDeleted: number }>('DELETE', `/admin/companies/${id}`);

// Restaure une entreprise soft-deleted (et ses users victimes du cascade).
export const restoreAdminCompany = (id: string) =>
  authRequest<{ companyId: string; usersRestored: number }>('POST', `/admin/companies/${id}/restore`);

// ─── Registres globaux (admin) ───────────────────────────────────
export const listAdminAttributions = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminAttribution>>('GET', `/admin/attributions?page=${page}&limit=${limit}`);

export const listAdminRedemptions = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminRedemption>>('GET', `/admin/redemptions?page=${page}&limit=${limit}`);

export const listAdminPurchases = (page = 1, limit = 20) =>
  authRequest<Paginated<AdminPurchase>>('GET', `/admin/purchases?page=${page}&limit=${limit}`);
