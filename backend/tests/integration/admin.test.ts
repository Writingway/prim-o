import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, auth } from './helpers';

// Guards + mutations admin (ex-run.sh, partie testable automatiquement).
describe('Admin API - guards & mutations', () => {
  let adminToken: string;
  let ownerToken: string;
  let adminId: string;
  let empId: string;

  beforeAll(async () => {
    adminToken = await login('admin@primo.fr');
    ownerToken = await login('boss@acme.fr'); // non-admin

    const res = await request(app).get('/api/admin/users').set(auth(adminToken));
    adminId = res.body.items.find((u: any) => u.role === 'ADMIN').id;
    empId = res.body.items.find((u: any) => u.role === 'EMPLOYEE').id;
  });

  it('sans token -> 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('token non-admin -> 403', async () => {
    const res = await request(app).get('/api/admin/users').set(auth(ownerToken));
    expect(res.status).toBe(403);
  });

  it('liste users paginée -> 200', async () => {
    const res = await request(app).get('/api/admin/users?page=1&limit=5').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
  });

  it('promote EMPLOYEE -> MANAGER puis revert (réversible)', async () => {
    const up = await request(app).patch(`/api/admin/users/${empId}`)
      .set(auth(adminToken)).send({ role: 'MANAGER' });
    expect(up.status).toBe(200);
    const down = await request(app).patch(`/api/admin/users/${empId}`)
      .set(auth(adminToken)).send({ role: 'EMPLOYEE' });
    expect(down.status).toBe(200);
  });

  it('body vide -> 400 (au moins un champ requis)', async () => {
    const res = await request(app).patch(`/api/admin/users/${empId}`)
      .set(auth(adminToken)).send({});
    expect(res.status).toBe(400);
  });

  it('ancien contrat {status} -> 400 (champ retiré du schéma)', async () => {
    const res = await request(app).patch(`/api/admin/users/${empId}`)
      .set(auth(adminToken)).send({ status: 'REJECTED' });
    expect(res.status).toBe(400);
  });

  it('auto-modification admin -> 400', async () => {
    const res = await request(app).patch(`/api/admin/users/${adminId}`)
      .set(auth(adminToken)).send({ role: 'MANAGER' });
    expect(res.status).toBe(400);
  });

  it('création company sans nom -> 400', async () => {
    const res = await request(app).post('/api/admin/companies')
      .set(auth(adminToken)).send({});
    expect(res.status).toBe(400);
  });
});
