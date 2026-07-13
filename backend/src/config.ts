import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5180'),
  // Public backend URL, used to build the email verification link.
  API_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  TOKEN_PRICE_CENTS: z.coerce.number().int().positive().default(100),

  // Brevo (transactional email). Without BREVO_API_KEY, dev mode logs the link to the console
  // instead of sending.
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().default('noreply@primo.local'),
  BREVO_SENDER_NAME: z.string().default("Prim'O"),
});

export const config = envSchema.parse(process.env);
