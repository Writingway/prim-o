import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, auth } from './helpers';

// Admin-only coverage: dashboard, ledgers and reversible company mutations.
describe('Admin - dashboard & ledgers (lectures)', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await login('admin@primo.fr');
  });

  it('GET /admin/stats -> 200', async () => {
    const res = await request(app).get('/api/admin/stats').set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it('GET /admin/companies -> 200 paginé', async () => {
    const res = await request(app).get('/api/admin/companies').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /admin/attributions -> 200', async () => {
    const res = await request(app).get('/api/admin/attributions?limit=5').set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it('GET /admin/redemptions -> 200', async () => {
    const res = await request(app).get('/api/admin/redemptions?limit=5').set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it('GET /admin/purchases -> 200', async () => {
    const res = await request(app).get('/api/admin/purchases?limit=5').set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it('GET /admin/categories -> 200', async () => {
    const res = await request(app).get('/api/admin/categories').set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it('POST /admin/companies crée une entreprise -> 201', async () => {
    const res = await request(app).post('/api/admin/companies').set(auth(adminToken))
      .send({ name: 'Misc Test Co' });
    expect(res.status).toBe(201);
  });

  it('soft-delete puis restore d\'une entreprise (réversible)', async () => {
    const companies = await request(app).get('/api/admin/companies').set(auth(adminToken));
    const testco = companies.body.items.find((c: any) => c.name === 'TestCo');

    const del = await request(app).delete(`/api/admin/companies/${testco.id}`).set(auth(adminToken));
    expect(del.status).toBe(200);

    const restore = await request(app).post(`/api/admin/companies/${testco.id}/restore`)
      .set(auth(adminToken));
    expect(restore.status).toBe(200);
  });
});
