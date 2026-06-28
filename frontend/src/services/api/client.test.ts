import { describe, it, expect, vi, beforeEach } from 'vitest';

// client.ts garde un état module (currentToken, refreshPromise).
// resetModules + import dynamique → module frais à chaque test, pas de fuite.
type Client = typeof import('./client');

async function loadClient(): Promise<Client> {
  vi.resetModules();
  return import('./client');
}

// Construit un fetch mock qui répond dans l'ordre donné.
type MockRes = { status: number; body?: unknown };
function mockFetch(...responses: MockRes[]) {
  const fn = vi.fn();
  for (const r of responses) {
    fn.mockResolvedValueOnce({
      ok: r.status < 400,
      status: r.status,
      json: async () => r.body ?? {},
    });
  }
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('authRequest — refresh & retry', () => {
  // ── Test #3 (worked example) : 429 sur le refresh → PAS de logout ──
  // Le cas que la plupart des équipes ratent : un rate-limit/5xx ne doit
  // jamais déconnecter l'utilisateur.
  it('ne déconnecte PAS si le refresh prend un 429', async () => {
    const client = await loadClient();
    const onExpired = vi.fn();
    client.registerSessionExpired(onExpired);
    client.setAccessToken('tok');

    mockFetch(
      { status: 401 },          // requête authentifiée → expirée
      { status: 429 },          // refresh rate-limité
    );

    const res = await client.authRequest('GET', '/protected');

    expect(onExpired).not.toHaveBeenCalled();   // session conservée
    expect(res.status).toBe(401);               // renvoie la 1re réponse
  });

  // ── Test #1 : singleton de refresh ──
  // 5 refresh() concurrents → /auth/refresh fetché UNE seule fois.
  it('partage une seule promesse refresh entre appels concurrents', async () => {
    const client = await loadClient();
    const fetchMock = mockFetch(
      { status: 200, body: { accessToken: 'frais' } }, // un seul refresh attendu
    );

    // 5 appels lancés AVANT tout await → ils doivent partager la promesse.
    const results = await Promise.all([
      client.refresh(),
      client.refresh(),
      client.refresh(),
      client.refresh(),
      client.refresh(),
    ]);

    // Une seule requête réseau vers /auth/refresh malgré 5 appels.
    const refreshCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('/auth/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
    // Les 5 reçoivent le même token frais.
    expect(results.every((r) => r.data?.accessToken === 'frais')).toBe(true);
  });

  // ── Test #2 : 401 → refresh ok → retry une fois → 200 ──
  it('rejoue la requête une fois après un refresh réussi', async () => {
    const client = await loadClient();
    client.setAccessToken('vieux-token');

    const fetchMock = mockFetch(
      { status: 401 },                                 // requête → token expiré
      { status: 200, body: { accessToken: 'frais' } }, // refresh réussit
      { status: 200, body: { value: 42 } },            // retry réussit
    );

    const res = await client.authRequest('GET', '/protected');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ value: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3); // requête + refresh + retry
  });

  // ── Test #4 : refresh 401 → logout ──
  it('déconnecte si le refresh est refusé (401/403)', async () => {
    const client = await loadClient();
    const onExpired = vi.fn();
    client.registerSessionExpired(onExpired);
    client.setAccessToken('tok');

    mockFetch(
      { status: 401 }, // requête → expirée
      { status: 401 }, // refresh refusé pour de vrai
    );

    await client.authRequest('GET', '/protected');

    expect(onExpired).toHaveBeenCalledOnce(); // session morte
  });

  // ── Test #5 : retry rend encore 401 → logout, pas de 3e essai ──
  it('déconnecte si le retry renvoie encore 401', async () => {
    const client = await loadClient();
    const onExpired = vi.fn();
    client.registerSessionExpired(onExpired);
    client.setAccessToken('tok');

    const fetchMock = mockFetch(
      { status: 401 },                                 // requête → expirée
      { status: 200, body: { accessToken: 'frais' } }, // refresh ok
      { status: 401 },                                 // retry interdit
    );

    await client.authRequest('GET', '/protected');

    expect(onExpired).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(3); // jamais de 4e essai
  });
});
