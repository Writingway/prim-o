import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth, SEED_PASSWORD } from './helpers';

// Owner-only coverage: company dashboard, stats, allocation and the
// onboarding path that creates a fresh owner company.
describe('Owner - company, stats & allocation', () => {
  let ownerToken: string;
  let managerId: string;

  beforeAll(async () => {
    ownerToken = await login('boss@acme.fr');

    const adminToken = await login('admin@primo.fr');
    const users = await request(app).get('/api/admin/users?limit=100').set(auth(adminToken));
    managerId = users.body.items.find((u: any) => u.email === 'manager@acme.fr').id;
  });

  it('GET /company (owner) -> 200', async () => {
    const res = await request(app).get('/api/company').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(res.body.company).toBeTruthy();
  });

  it('GET /stats (owner) -> 200', async () => {
    const res = await request(app).get('/api/stats').set(auth(ownerToken));
    expect(res.status).toBe(200);
  });

  it('GET /attributions/managers (owner) -> 200', async () => {
    const res = await request(app).get('/api/attributions/managers').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.managers)).toBe(true);
  });

  it('owner alloue 5 jetons au manager -> 201', async () => {
    const res = await request(app).post('/api/attributions/allocate')
      .set(auth(ownerToken)).send({ managerId, amount: 5, mode: 'AUCUNE' });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(5);
    expect(typeof res.body.companyTokenBalance).toBe('number');
  });
});

describe('Owner - onboarding company flow', () => {
  const ownerEmail = 'owner.integration@primo.test';
  let ownerToken: string;

  it('register -> verify -> login -> create-company -> 201 PENDING', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      firstName: 'Owner', lastName: 'Integration', email: ownerEmail, password: SEED_PASSWORD,
    });
    expect(reg.status).toBe(201);

    await verifyEmail(ownerEmail);
    ownerToken = await login(ownerEmail);

    const res = await request(app).post('/api/auth/create-company')
      .set(auth(ownerToken)).send({ companyName: 'Owner Integration Co' });
    expect(res.status).toBe(201);
    expect(res.body.company.status).toBe('PENDING');
    expect(res.body.accessToken).toBeTruthy();
    ownerToken = res.body.accessToken;
  });

  it('checkout bloqué tant que la company est PENDING -> 403', async () => {
    const res = await request(app).post('/api/stripe/checkout')
      .set(auth(ownerToken)).send({ amount: 10 });
    expect(res.status).toBe(403);
  });

  it('owner génère un code MANAGER -> 201', async () => {
    const activeOwnerToken = await login('boss@acme.fr');
    const res = await request(app).post('/api/invites/generate')
      .set(auth(activeOwnerToken)).send({ role: 'MANAGER', maxUses: 1, expiresInHours: 24 });
    expect(res.status).toBe(201);
    expect(res.body.invite.code).toBeTruthy();
  });
});