import { z } from 'zod';
import { safeText } from '../lib/validation';

export const registerManagerSchema = z.object({
  companyName: safeText(2),
  firstName: safeText(2),
  lastName: safeText(2),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterManagerInput = z.infer<typeof registerManagerSchema>;

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
