import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

const safeText = (min: number) =>
  z.string()
    .transform((v) => sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} }).trim())
    .pipe(z.string().min(min));


export const registerEmployerSchema = z.object({
  companyName: safeText(2),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerEmployeeSchema = z.object({
  firstName: safeText(2),
  lastName: safeText(2),
  email: z.email(),
  password: z.string().min(8),
  employerId: z.string().min(1),
});

export type RegisterEmployeeInput = z.infer<typeof registerEmployeeSchema>;
