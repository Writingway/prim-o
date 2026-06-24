import z from 'zod';
import { safeText } from '../lib/validation';   // already used by offer.schemas

export const createCompanySchema = z.object({
  name: safeText(1),     // required, trimmed, min length 1
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;


export const idParamSchema = z.uuid();   // reject garbage :id with clean 400

// Validation d'une entreprise par l'admin : APPROVED ou REJECTED uniquement.
export const companyStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type CompanyStatusInput = z.infer<typeof companyStatusSchema>;

export const listUsersQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  role:      z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  companyId: z.uuid().optional(),
  search:    z.string().trim().max(255).optional(),    // email contains
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// role is restricted to MANAGER/EMPLOYEE on purpose: you can NEVER
// promote someone to ADMIN through this API (privilege-escalation block).
export const updateUserSchema = z.object({
  role: z.enum(['MANAGER', 'EMPLOYEE']).optional(),
  isEmailVerified: z.boolean().optional(),
}).refine((d) => d.role !== undefined || d.isEmailVerified !== undefined, {
  message: 'At least one field required',
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Pagination query for any list endpoint (users, companies, etc.)
export const paginationQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

