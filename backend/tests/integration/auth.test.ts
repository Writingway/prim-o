import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth, SEED_PASSWORD } from './helpers';

// Auth endpoints outside the onboarding flow: validations, guards, silent
// endpoints (anti-enumeration) and refresh cookie handling.
describe('Auth - validations & endpoints annexes', () => {
  it('register body invalide -> 400', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ firstName: 'X', email: 'pasunemail', password: '123' });
    expect(res.status).toBe(400);
  });

  it('register email déjà pris -> 409', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Dup', lastName: 'Lique', email: 'admin@primo.fr', password: SEED_PASSWORD,
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('login mauvais mot de passe -> 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@primo.fr', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /me sans token -> 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me avec token -> 200 + identité', async () => {
    const token = await login('admin@primo.fr');
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@primo.fr');
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('login pose un cookie refreshToken httpOnly', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@primo.fr', password: SEED_PASSWORD });
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/refreshToken=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('refresh sans cookie -> 401', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('refresh avec cookie valide -> 200 + nouveau accessToken', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@primo.fr', password: SEED_PASSWORD });
    const res = await agent.post('/api/auth/refresh');
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('logout -> 204', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });

  it('resend-verification -> 200 silencieux (email inconnu)', async () => {
    const res = await request(app).post('/api/auth/resend-verification')
      .send({ email: 'inconnu@nowhere.test' });
    expect(res.status).toBe(200);
  });

  it('forgot-password -> 200 silencieux (anti-énumération)', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'inconnu@nowhere.test' });
    expect(res.status).toBe(200);
  });

  it('reset-password token invalide -> 401', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'deadbeef'.repeat(8), password: SEED_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('verify-email token invalide -> redirect verified=0', async () => {
    const res = await request(app).get('/api/auth/verify-email?token=invalide');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('verified=0');
  });
});
