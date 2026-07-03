import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, login, verifyEmail, auth, SEED_PASSWORD } from './helpers';

// Parcours critique account-first (ex-smoke.sh) :
// register -> verify -> login -> create-company (PENDING) -> checkout bloqué
// -> admin approuve -> invite -> join-company. DB de test seedée par global-setup.
const OWNER_EMAIL = 'patron@integration.test';
const EMP_EMAIL = 'employe@integration.test';

describe('Onboarding account-first', () => {
  let ownerToken: string;
  let empToken: string;
  let companyId: string;
  let inviteCode: string;

  it('register -> 201, pas de token (vérification email requise)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Pat', lastName: 'Ron', email: OWNER_EMAIL, password: SEED_PASSWORD,
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('login avant vérification -> 403 EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: OWNER_EMAIL, password: SEED_PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('auto-verify puis login -> accessToken', async () => {
    await verifyEmail(OWNER_EMAIL);
    ownerToken = await login(OWNER_EMAIL);
    expect(ownerToken).toBeTruthy();
  });

  it('create-company -> 201, PENDING, token frais', async () => {
    const res = await request(app).post('/api/auth/create-company')
      .set(auth(ownerToken)).send({ companyName: 'IntegrationCo' });
    expect(res.status).toBe(201);
    expect(res.body.company.status).toBe('PENDING');
    expect(res.body.accessToken).toBeTruthy();
    companyId = res.body.company.id;
    ownerToken = res.body.accessToken;
  });

  it('checkout bloqué tant que PENDING -> 403', async () => {
    const res = await request(app).post('/api/stripe/checkout')
      .set(auth(ownerToken)).send({ amount: 10 });
    expect(res.status).toBe(403);
  });

  it('admin approuve la company -> 200', async () => {
    const adminToken = await login('admin@primo.fr');
    const res = await request(app).patch(`/api/admin/companies/${companyId}/status`)
      .set(auth(adminToken)).send({ status: 'APPROVED' });
    expect(res.status).toBe(200);
  });

  it('owner génère un code EMPLOYEE -> 201', async () => {
    const res = await request(app).post('/api/invites/generate')
      .set(auth(ownerToken)).send({ role: 'EMPLOYEE', maxUses: 5, expiresInHours: 24 });
    expect(res.status).toBe(201);
    inviteCode = res.body.invite.code;
    expect(inviteCode).toBeTruthy();
  });

  it('employé : register + verify + login + join-company -> 200', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      firstName: 'Emp', lastName: 'Loye', email: EMP_EMAIL, password: SEED_PASSWORD,
    });
    expect(reg.status).toBe(201);
    await verifyEmail(EMP_EMAIL);
    empToken = await login(EMP_EMAIL);

    const res = await request(app).post('/api/auth/join-company')
      .set(auth(empToken)).send({ code: inviteCode });
    expect(res.status).toBe(200);
  });

  it('join-company une 2e fois -> 409 ALREADY_IN_COMPANY', async () => {
    const res = await request(app).post('/api/auth/join-company')
      .set(auth(empToken)).send({ code: inviteCode });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_IN_COMPANY');
  });
});
