import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth } from './helpers';

// Espace employé : solde, historiques reçus/dépensés, échange d'une offre
// contre des tokens, bascule « utilisé » d'un code. Employé seedé
// jean.dupont@acme.fr (30 tokens). Netflix coûte 15 (code seedé dispo).
describe('Employé - solde, échange & historiques', () => {
  let empToken: string;
  let ownerToken: string;
  let netflixId: string;

  beforeAll(async () => {
    await verifyEmail('jean.dupont@acme.fr');
    empToken = await login('jean.dupont@acme.fr');
    ownerToken = await login('boss@acme.fr');

    const offers = await request(app).get('/api/offers');
    netflixId = offers.body.offers.find((o: any) => o.partnerName === 'Netflix').id;
  });

  it('GET /employees/me -> 200 + solde', async () => {
    const res = await request(app).get('/api/employees/me').set(auth(empToken));
    expect(res.status).toBe(200);
    expect(typeof res.body.balance).toBe('number');
  });

  it('GET /employees/me/received -> 200 paginé', async () => {
    const res = await request(app).get('/api/employees/me/received').set(auth(empToken));
    expect(res.status).toBe(200);
  });

  it('GET /employees/me/spent -> 200 paginé', async () => {
    const res = await request(app).get('/api/employees/me/spent').set(auth(empToken));
    expect(res.status).toBe(200);
  });

  it('POST /me/redeem Netflix -> 201 (code promo attribué)', async () => {
    const res = await request(app).post('/api/employees/me/redeem')
      .set(auth(empToken)).send({ offerId: netflixId });
    expect(res.status).toBe(201);
  });

  it('owner (ni EMPLOYEE ni MANAGER) ne peut pas échanger -> 403', async () => {
    const res = await request(app).post('/api/employees/me/redeem')
      .set(auth(ownerToken)).send({ offerId: netflixId });
    expect(res.status).toBe(403);
  });

  it('PATCH /me/spent/:id bascule « utilisé » -> 200', async () => {
    const spent = await request(app).get('/api/employees/me/spent').set(auth(empToken));
    const redemptionId = spent.body.items[0].id;
    const res = await request(app).patch(`/api/employees/me/spent/${redemptionId}`)
      .set(auth(empToken)).send({ used: true });
    expect(res.status).toBe(200);
  });

  it('PATCH /me/spent/:id sans booléen used -> 400', async () => {
    const res = await request(app).patch('/api/employees/me/spent/some-id')
      .set(auth(empToken)).send({});
    expect(res.status).toBe(400);
  });

  it('GET /employees/list (owner) -> 200', async () => {
    const res = await request(app).get('/api/employees/list').set(auth(ownerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.employees)).toBe(true);
  });

  it('GET /employees/list sans token -> 401', async () => {
    const res = await request(app).get('/api/employees/list');
    expect(res.status).toBe(401);
  });
});
