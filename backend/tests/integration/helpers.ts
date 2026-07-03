import request from 'supertest';
import app from '../../src/app';

export { app };

// Mot de passe commun du seed.
export const SEED_PASSWORD = 'password123';

export async function login(email: string, password: string = SEED_PASSWORD): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200 || !res.body.accessToken) {
    throw new Error(`login ${email} -> ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
}

// Force isEmailVerified=true via la route de test (montée hors production).
export async function verifyEmail(email: string): Promise<void> {
  const res = await request(app).post('/api/test/verify-email').send({ email });
  if (res.status !== 200) {
    throw new Error(`verify-email ${email} -> ${res.status} ${JSON.stringify(res.body)}`);
  }
}

export const auth = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});
