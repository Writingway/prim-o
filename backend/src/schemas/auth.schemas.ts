import { z } from 'zod';

export const registerEmployerSchema = z.object({
  companyName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;

export const registerEmployeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  employerId: z.string().min(1),
});

export type RegisterEmployeeInput = z.infer<typeof registerEmployeeSchema>;