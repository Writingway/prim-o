import { z } from 'zod';

export const registerEmployerSchema = z.object({
  companyName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;


export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
