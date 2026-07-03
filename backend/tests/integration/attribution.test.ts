import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth } from './helpers';

// Chemin « argent » : allocation patron -> manager, puis redistribution
// complète de l'enveloppe manager -> employé. Données du seed (Acme).
describe('Jetons - allocation & distribution', () => {
  let ownerToken: string;
  let mgrToken: string;
  let managerId: string;
  let employeeId: string;
  let motifId: string;
  let allocationId: string;

  beforeAll(async () => {
    ownerToken = await login('boss@acme.fr');
    // Le manager seedé n'est pas email-vérifié : on force via la route de test.
    await verifyEmail('manager@acme.fr');
    mgrToken = await login('manager@acme.fr');

    // Ids réels depuis l'API admin (source la plus stable).
    const adminToken = await login('admin@primo.fr');
    const users = await request(app).get('/api/admin/users?limit=100').set(auth(adminToken));
    managerId = users.body.items.find((u: any) => u.email === 'manager@acme.fr').id;
    employeeId = users.body.items.find((u: any) => u.email === 'jean.dupont@acme.fr').id;

    // Shape : { categories: [{ category, motifs: [{ id, ... }] }] }
    const motifs = await request(app).get('/api/motifs').set(auth(mgrToken));
    motifId = motifs.body.categories[0].motifs[0].id;
  });

  it('owner alloue 5 jetons au manager -> 201, pool débité', async () => {
    const res = await request(app).post('/api/attributions/allocate')
      .set(auth(ownerToken)).send({ managerId, amount: 5, mode: 'AUCUNE' });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(5);
    expect(typeof res.body.companyTokenBalance).toBe('number');
    allocationId = res.body.allocationId;
  });

  it('un non-owner ne peut pas allouer -> 403', async () => {
    const res = await request(app).post('/api/attributions/allocate')
      .set(auth(mgrToken)).send({ managerId, amount: 5, mode: 'AUCUNE' });
    expect(res.status).toBe(403);
  });

  it('le manager voit son enveloppe -> 200', async () => {
    const res = await request(app).get('/api/attributions/envelopes').set(auth(mgrToken));
    expect(res.status).toBe(200);
    const env = res.body.envelopes.find((e: any) => e.allocationId === allocationId || e.id === allocationId);
    expect(env).toBeTruthy();
  });

  it('distribution incomplète -> 422 (le total doit égaler le budget)', async () => {
    const res = await request(app).post('/api/attributions/distribute')
      .set(auth(mgrToken))
      .send({ allocationId, lines: [{ employeeId, amount: 3, motifId }] });
    expect(res.status).toBe(422);
  });

  it('distribution complète (5/5) -> 201', async () => {
    const res = await request(app).post('/api/attributions/distribute')
      .set(auth(mgrToken))
      .send({ allocationId, lines: [{ employeeId, amount: 5, motifId }] });
    expect(res.status).toBe(201);
  });

  it('re-distribution de la même enveloppe -> 409 (déjà distribuée)', async () => {
    const res = await request(app).post('/api/attributions/distribute')
      .set(auth(mgrToken))
      .send({ allocationId, lines: [{ employeeId, amount: 5, motifId }] });
    expect(res.status).toBe(409);
  });

  // ── Lectures (UI patron / manager) ──────────────────────
  it('GET /attributions/managers (owner) -> 200', async () => {
    const res = await request(app).get('/api/attributions/managers').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.managers)).toBe(true);
  });

  it('GET /attributions/balances (manager) -> 200', async () => {
    const res = await request(app).get('/api/attributions/balances').set(auth(mgrToken));
    expect(res.status).toBe(200);
  });

  it('GET /attributions/sent-envelopes (manager) -> 200', async () => {
    const res = await request(app).get('/api/attributions/sent-envelopes').set(auth(mgrToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.envelopes)).toBe(true);
  });

  it('GET /attributions (manager) -> 200 historique', async () => {
    const res = await request(app).get('/api/attributions').set(auth(mgrToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.attributions)).toBe(true);
  });

  it('GET /attributions sans token -> 401', async () => {
    const res = await request(app).get('/api/attributions');
    expect(res.status).toBe(401);
  });
});
