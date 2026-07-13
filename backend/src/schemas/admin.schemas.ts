import z from 'zod';
import { safeText } from '../lib/validation';

export const createCompanySchema = z.object({
  name: safeText(1),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;


// Validates :id route params so malformed ids fail fast with a 400.
export const idParamSchema = z.uuid();

// Admin decision on a pending company registration.
export const companyStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type CompanyStatusInput = z.infer<typeof companyStatusSchema>;

export const listUsersQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  role:      z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  companyId: z.uuid().optional(),
  // Substring match on user email.
  search:    z.string().trim().max(255).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// Role is restricted to MANAGER/EMPLOYEE on purpose: this endpoint can never promote anyone to
// ADMIN (privilege-escalation guard).
export const updateUserSchema = z.object({
  role: z.enum(['MANAGER', 'EMPLOYEE']).optional(),
  isEmailVerified: z.boolean().optional(),
}).refine((d) => d.role !== undefined || d.isEmailVerified !== undefined, {
  message: 'At least one field required',
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Shared pagination query for list endpoints (users, companies, etc.).
export const paginationQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

