import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth, SEED_PASSWORD } from './helpers';

// GDPR: profile (read/update), data export, account deletion
// (anonymization, confirmed by password). Uses a throwaway account
// so the seeded data isn't broken.
const VICTIM = 'privacy-victim@integration.test';

describe('RGPD - profil, export & suppression', () => {
  let token: string;

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      firstName: 'Priva', lastName: 'Cy', email: VICTIM, password: SEED_PASSWORD,
    });
    await verifyEmail(VICTIM);
    token = await login(VICTIM);
  });

  it('GET /me -> 200 + profil', async () => {
    const res = await request(app).get('/api/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.profile.email).toBe(VICTIM);
  });

  it('PATCH /me met à jour le prénom -> 200', async () => {
    const res = await request(app).patch('/api/me').set(auth(token))
      .send({ firstName: 'Nouveau' });
    expect(res.status).toBe(200);
  });

  it('PATCH /me sans aucun champ -> 400', async () => {
    const res = await request(app).patch('/api/me').set(auth(token)).send({});
    expect(res.status).toBe(400);
  });

  it('GET /me/export -> 200 (portabilité des données)', async () => {
    const res = await request(app).get('/api/me/export').set(auth(token));
    expect(res.status).toBe(200);
  });

  it('DELETE /me mauvais mot de passe -> 401', async () => {
    const res = await request(app).delete('/api/me').set(auth(token))
      .send({ password: 'mauvais' });
    expect(res.status).toBe(401);
  });

  it('DELETE /me bon mot de passe -> 204 (anonymisation)', async () => {
    const res = await request(app).delete('/api/me').set(auth(token))
      .send({ password: SEED_PASSWORD });
    expect(res.status).toBe(204);
  });

  it('accès profil sans token -> 401', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });
});
