import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5180'),
  // URL publique du backend - sert à construire le lien de vérification email.
  API_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  TOKEN_PRICE_CENTS: z.coerce.number().int().positive().default(100),

  // Brevo (email transactionnel). Sans BREVO_API_KEY → mode dev : le lien
  // est loggé en console au lieu d'être envoyé.
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().default('noreply@primo.local'),
  BREVO_SENDER_NAME: z.string().default("Prim'O"),
});

export const config = envSchema.parse(process.env);
