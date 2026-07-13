import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth } from './helpers';

// Manager-only coverage: envelope visibility, distribution, history and the
// manager-specific invite restrictions.
describe('Manager - envelopes, distribution & invite limits', () => {
  let ownerToken: string;
  let managerToken: string;
  let managerId: string;
  let employeeId: string;
  let motifId: string;
  let allocationId: string;

  beforeAll(async () => {
    ownerToken = await login('boss@acme.fr');
    await verifyEmail('manager@acme.fr');
    managerToken = await login('manager@acme.fr');

    const adminToken = await login('admin@primo.fr');
    const users = await request(app).get('/api/admin/users?limit=100').set(auth(adminToken));
    managerId = users.body.items.find((u: any) => u.email === 'manager@acme.fr').id;
    employeeId = users.body.items.find((u: any) => u.email === 'jean.dupont@acme.fr').id;

    const motifs = await request(app).get('/api/motifs').set(auth(managerToken));
    motifId = motifs.body.categories[0].motifs[0].id;

    const allocation = await request(app).post('/api/attributions/allocate')
      .set(auth(ownerToken)).send({ managerId, amount: 5, mode: 'AUCUNE' });
    expect(allocation.status).toBe(201);
    allocationId = allocation.body.allocationId;
  });

  it('GET /attributions/envelopes (manager) -> 200', async () => {
    const res = await request(app).get('/api/attributions/envelopes').set(auth(managerToken));
    expect(res.status).toBe(200);
    const env = res.body.envelopes.find((e: any) => e.allocationId === allocationId || e.id === allocationId);
    expect(env).toBeTruthy();
  });

  it('GET /attributions/balances (manager) -> 200', async () => {
    const res = await request(app).get('/api/attributions/balances').set(auth(managerToken));
    expect(res.status).toBe(200);
  });

  it('GET /attributions/sent-envelopes (manager) -> 200', async () => {
    const res = await request(app).get('/api/attributions/sent-envelopes').set(auth(managerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.envelopes)).toBe(true);
  });

  it('GET /attributions (manager) -> 200 historique', async () => {
    const res = await request(app).get('/api/attributions').set(auth(managerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.attributions)).toBe(true);
  });

  it('GET /attributions/managers (manager) -> 200', async () => {
    const res = await request(app).get('/api/attributions/managers').set(auth(managerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.managers)).toBe(true);
  });

  it('distribution incomplète -> 422', async () => {
    const res = await request(app).post('/api/attributions/distribute')
      .set(auth(managerToken))
      .send({ allocationId, lines: [{ employeeId, amount: 3, motifId }] });
    expect(res.status).toBe(422);
  });

  it('distribution complète (5/5) -> 201', async () => {
    const res = await request(app).post('/api/attributions/distribute')
      .set(auth(managerToken))
      .send({ allocationId, lines: [{ employeeId, amount: 5, motifId }] });
    expect(res.status).toBe(201);
  });

  it('re-distribution de la même enveloppe -> 409', async () => {
    const res = await request(app).post('/api/attributions/distribute')
      .set(auth(managerToken))
      .send({ allocationId, lines: [{ employeeId, amount: 5, motifId }] });
    expect(res.status).toBe(409);
  });

  it('manager ne peut pas générer un code manager -> 403', async () => {
    const res = await request(app).post('/api/invites/generate')
      .set(auth(managerToken)).send({ role: 'MANAGER', maxUses: 1, expiresInHours: 24 });
    expect(res.status).toBe(403);
  });

  it('manager peut générer un code employee -> 201', async () => {
    const res = await request(app).post('/api/invites/generate')
      .set(auth(managerToken)).send({ role: 'EMPLOYEE', maxUses: 1, expiresInHours: 24 });
    expect(res.status).toBe(201);
    expect(res.body.invite.code).toBeTruthy();
  });
});