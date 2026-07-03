import { describe, it, expect, vi, beforeEach } from 'vitest';

// identity.ts garde un état module (cache court, TTL 30 s). resetModules +
// import dynamique → module frais à chaque test, pas de fuite de cache.
// authRequest (client) est mocké : on pilote GET /auth/me sans réseau.
type Identity = import('@/services/api/identity').Identity;

const authRequest = vi.fn();
vi.mock('@/services/api/client', () => ({ authRequest: (...a: unknown[]) => authRequest(...a) }));

type IdentityModule = typeof import('@/services/api/identity');
async function loadIdentity(): Promise<IdentityModule> {
  vi.resetModules();
  return import('@/services/api/identity');
}

// Réponse type d'authRequest : { ok, status, data }.
function res(status: number, data?: unknown) {
  return { ok: status < 400, status, data };
}

const fakeUser: Identity = {
  id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B',
  role: 'OWNER', companyId: 'c1',
  company: { id: 'c1', name: 'Co', status: 'APPROVED' },
  profilePhoto: null,
};

beforeEach(() => {
  authRequest.mockReset();
});

describe('normalizeRole', () => {
  it('backend MAJ → front min', async () => {
    const { normalizeRole } = await loadIdentity();
    expect(normalizeRole('OWNER')).toBe('owner');
    expect(normalizeRole('ADMIN')).toBe('admin');
    expect(normalizeRole('EMPLOYEE')).toBe('employee');
    expect(normalizeRole('MANAGER')).toBe('manager');
  });

  it('null (flottant) reste null', async () => {
    const { normalizeRole } = await loadIdentity();
    expect(normalizeRole(null)).toBeNull();
  });
});

describe('getIdentity — cache & échecs transitoires', () => {
  it('200 → renvoie l\'identité et la met en cache (1 seul fetch)', async () => {
    const { getIdentity } = await loadIdentity();
    authRequest.mockResolvedValue(res(200, { user: fakeUser }));

    const a = await getIdentity();
    const b = await getIdentity();   // dans le TTL → cache

    expect(a).toEqual(fakeUser);
    expect(b).toEqual(fakeUser);
    expect(authRequest).toHaveBeenCalledTimes(1);   // 2e appel servi par le cache
  });

  it('401 → identity null, ET mise en cache du null (pas de session)', async () => {
    const { getIdentity } = await loadIdentity();
    authRequest.mockResolvedValue(res(401));

    const a = await getIdentity();
    const b = await getIdentity();

    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(authRequest).toHaveBeenCalledTimes(1);   // null caché → pas re-fetché
  });

  //  Le cas durci (miroir du backend) : un 429 / 5xx / coupure ne doit PAS
  //    empoisonner l'identité. On NE cache PAS → l'appel suivant re-tente. 
  it('429 → null MAIS ne cache PAS (échec transitoire)', async () => {
    const { getIdentity } = await loadIdentity();
    authRequest.mockResolvedValueOnce(res(429));
    authRequest.mockResolvedValueOnce(res(200, { user: fakeUser }));

    const a = await getIdentity();   // blip
    const b = await getIdentity();   // re-tente → récupère l'identité

    expect(a).toBeNull();
    expect(b).toEqual(fakeUser);
    expect(authRequest).toHaveBeenCalledTimes(2);   // pas de cache sur le 429
  });

  it('500 → null sans cache (re-tente au prochain appel)', async () => {
    const { getIdentity } = await loadIdentity();
    authRequest.mockResolvedValueOnce(res(500));
    authRequest.mockResolvedValueOnce(res(200, { user: fakeUser }));

    expect(await getIdentity()).toBeNull();
    expect(await getIdentity()).toEqual(fakeUser);
    expect(authRequest).toHaveBeenCalledTimes(2);
  });

  it('clearIdentityCache force un nouveau fetch', async () => {
    const { getIdentity, clearIdentityCache } = await loadIdentity();
    authRequest.mockResolvedValue(res(200, { user: fakeUser }));

    await getIdentity();
    clearIdentityCache();
    await getIdentity();

    expect(authRequest).toHaveBeenCalledTimes(2);   // cache vidé → re-fetch
  });
});
