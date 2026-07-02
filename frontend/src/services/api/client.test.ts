import { describe, it, expect, vi, beforeEach } from 'vitest';

// client.ts keeps module-level state (currentToken, refreshPromise).
// resetModules + dynamic import → a fresh module per test, no state leaking across tests.
type Client = typeof import('./client');

async function loadClient(): Promise<Client> {
  vi.resetModules();
  return import('./client');
}

// Builds a fetch mock that replies with the given responses, in order.
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
  // A 429 on the refresh must NOT log the user out — the case most implementations get wrong:
  // a rate limit or 5xx is transient, not a dead session.
  it('ne déconnecte PAS si le refresh prend un 429', async () => {
    const client = await loadClient();
    const onExpired = vi.fn();
    client.registerSessionExpired(onExpired);
    client.setAccessToken('tok');

    mockFetch(
      { status: 401 },          // authenticated request → expired
      { status: 429 },          // refresh rate-limited
    );

    const res = await client.authRequest('GET', '/protected');

    expect(onExpired).not.toHaveBeenCalled();   // session kept
    expect(res.status).toBe(401);               // returns the first response
  });

  // Refresh singleton: 5 concurrent refresh() calls → /auth/refresh is fetched exactly once.
  it('partage une seule promesse refresh entre appels concurrents', async () => {
    const client = await loadClient();
    const fetchMock = mockFetch(
      { status: 200, body: { accessToken: 'frais' } }, // a single refresh expected
    );

    // All 5 calls start BEFORE any await, so they must share the same promise.
    const results = await Promise.all([
      client.refresh(),
      client.refresh(),
      client.refresh(),
      client.refresh(),
      client.refresh(),
    ]);

    // A single network request to /auth/refresh despite 5 calls.
    const refreshCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('/auth/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
    // All 5 callers receive the same fresh token.
    expect(results.every((r) => r.data?.accessToken === 'frais')).toBe(true);
  });

  // Happy path: 401 → successful refresh → single retry → 200.
  it('rejoue la requête une fois après un refresh réussi', async () => {
    const client = await loadClient();
    client.setAccessToken('vieux-token');

    const fetchMock = mockFetch(
      { status: 401 },                                 // request → token expired
      { status: 200, body: { accessToken: 'frais' } }, // refresh succeeds
      { status: 200, body: { value: 42 } },            // retry succeeds
    );

    const res = await client.authRequest('GET', '/protected');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ value: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3); // request + refresh + retry
  });

  // A 401/403 on the refresh itself means the session is really dead → logout.
  it('déconnecte si le refresh est refusé (401/403)', async () => {
    const client = await loadClient();
    const onExpired = vi.fn();
    client.registerSessionExpired(onExpired);
    client.setAccessToken('tok');

    mockFetch(
      { status: 401 }, // request → expired
      { status: 401 }, // refresh genuinely rejected
    );

    await client.authRequest('GET', '/protected');

    expect(onExpired).toHaveBeenCalledOnce(); // session dead
  });

  // A 401 on the retry is a real denial: logout, and never a third attempt.
  it('déconnecte si le retry renvoie encore 401', async () => {
    const client = await loadClient();
    const onExpired = vi.fn();
    client.registerSessionExpired(onExpired);
    client.setAccessToken('tok');

    const fetchMock = mockFetch(
      { status: 401 },                                 // request → expired
      { status: 200, body: { accessToken: 'frais' } }, // refresh ok
      { status: 401 },                                 // retry denied
    );

    await client.authRequest('GET', '/protected');

    expect(onExpired).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(3); // never a fourth attempt
  });
});
