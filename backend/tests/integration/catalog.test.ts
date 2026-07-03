import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, auth } from './helpers';

// Vitrine publique (offres, catégories) + CRUD admin des offres, catégories
// et codes promo.
describe('Catalogue - vitrine publique & CRUD admin', () => {
  let adminToken: string;
  let categoryId: string;

  beforeAll(async () => {
    adminToken = await login('admin@primo.fr');
    const cats = await request(app).get('/api/offers/categories');
    categoryId = cats.body.categories[0].id;
  });

  //  Public (optionalAuth) 
  it('GET /offers/categories (public) -> 200', async () => {
    const res = await request(app).get('/api/offers/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('GET /offers (public) -> 200 + liste', async () => {
    const res = await request(app).get('/api/offers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.offers)).toBe(true);
  });

  it('GET /offers/:id -> 200', async () => {
    const list = await request(app).get('/api/offers');
    const id = list.body.offers[0].id;
    const res = await request(app).get(`/api/offers/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.offer.id).toBe(id);
  });

  it('GET /offers/:id uuid invalide -> 400', async () => {
    const res = await request(app).get('/api/offers/pas-un-uuid');
    expect(res.status).toBe(400);
  });

  //  Offres (admin) : create -> update -> promo -> delete 
  it('cycle offre complet (create/update/promo/delete)', async () => {
    const create = await request(app).post('/api/admin/offers').set(auth(adminToken))
      .send({ partnerName: 'TestPartner', cost: 10, discountPercent: 25, categoryId });
    expect(create.status).toBe(201);
    const offerId = create.body.offer.id;

    const update = await request(app).patch(`/api/admin/offers/${offerId}`).set(auth(adminToken))
      .send({ cost: 12 });
    expect(update.status).toBe(200);
    expect(update.body.offer.cost).toBe(12);

    const addCodes = await request(app).post(`/api/admin/offers/${offerId}/promo-codes`)
      .set(auth(adminToken)).send({ codes: ['CODE-A', 'CODE-B'] });
    expect(addCodes.status).toBe(201);

    const listCodes = await request(app).get(`/api/admin/offers/${offerId}/promo-codes`)
      .set(auth(adminToken));
    expect(listCodes.status).toBe(200);
    expect(listCodes.body.codes.length).toBe(2);

    // Suppression d'un code encore disponible -> 200
    const delCode = await request(app).delete(`/api/admin/promo-codes/${listCodes.body.codes[0].id}`)
      .set(auth(adminToken));
    expect(delCode.status).toBe(200);

    // Désactivation (soft) de l'offre -> 200
    const del = await request(app).delete(`/api/admin/offers/${offerId}`).set(auth(adminToken));
    expect(del.status).toBe(200);
  });

  it('création offre sans token admin -> 401', async () => {
    const res = await request(app).post('/api/admin/offers')
      .send({ partnerName: 'X', cost: 10, discountPercent: 25, categoryId });
    expect(res.status).toBe(401);
  });

  //  Catégories (admin) : create -> update -> delete 
  it('cycle catégorie complet (create/update/delete)', async () => {
    const create = await request(app).post('/api/admin/categories').set(auth(adminToken))
      .send({ label: 'Test Cat', icon: 'gift', color: '#123abc', slug: 'test-cat' });
    expect(create.status).toBe(201);
    const catId = create.body.category.id;

    const update = await request(app).patch(`/api/admin/categories/${catId}`).set(auth(adminToken))
      .send({ label: 'Test Cat 2' });
    expect(update.status).toBe(200);

    const del = await request(app).delete(`/api/admin/categories/${catId}`).set(auth(adminToken));
    expect(del.status).toBe(200);
  });

  it('création catégorie couleur invalide -> 400', async () => {
    const res = await request(app).post('/api/admin/categories').set(auth(adminToken))
      .send({ label: 'Bad', icon: 'gift', color: 'red', slug: 'bad' });
    expect(res.status).toBe(400);
  });
});
