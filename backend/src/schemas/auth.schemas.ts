import { z } from 'zod';
import { safeText } from '../lib/validation';

export const registerCompanySchema = z.object({
  companyName: safeText(2),
  firstName: safeText(2),
  lastName: safeText(2),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerUserSchema = z.object({
  firstName: safeText(2),
  lastName: safeText(2),
  email: z.email(),
  password: z.string().min(8),
  code: z.string().min(6), // Le code d'invitation est optionnel côté backend : on vérifie sa présence dans le service.
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

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
