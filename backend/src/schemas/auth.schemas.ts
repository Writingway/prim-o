import { z } from 'zod';
import { safeText } from '../lib/validation';

// Account-first flow: registration only creates the user (no company, no invite code).
export const registerSchema = z.object({
  firstName: safeText(2),
  lastName: safeText(2),
  email: z.email(),
  password: z.string().min(8),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Company creation by an authenticated floating user (not attached to a company yet).
export const createCompanySchema = z.object({
  companyName: safeText(2),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// Joining a company via invite code (authenticated floating user).
export const joinCompanySchema = z.object({
  code: z.string().min(6),
});
export type JoinCompanyInput = z.infer<typeof joinCompanySchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resendVerificationSchema = z.object({
  email: z.email(),
});
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
