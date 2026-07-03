// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Identity } from '@/services/api/identity';

// ── Test d'intégration du routage ──
// On pilote l'identité (source de vérité, normalement GET /auth/me) et on
// vérifie où les gardes `beforeLoad` envoient l'utilisateur. On NE monte PAS
// les pages (pas de RouterProvider) : on résout juste les gardes via
// router.navigate() et on lit router.state.location.pathname. Cela exerce la
// VRAIE logique de redirection sans déclencher les appels API des dashboards.

let currentIdentity: Identity | null = null;

// getIdentity mocké ; normalizeRole/clearIdentityCache gardés réels.
vi.mock('@/services/api/identity', async (importActual) => {
  const actual = await importActual<typeof import('@/services/api/identity')>();
  return { ...actual, getIdentity: () => Promise.resolve(currentIdentity) };
});

import { router } from '@/router';

// Fabriques d'identité par état métier.
const floating: Identity = { id: 'u', email: 'f@x.fr', firstName: null, lastName: null, role: null, companyId: null, company: null, profilePhoto: null };
const owner: Identity = { id: 'o', email: 'o@x.fr', firstName: 'O', lastName: null, role: 'OWNER', companyId: 'c1', company: { id: 'c1', name: 'Co', status: 'APPROVED' }, profilePhoto: null };
const employee: Identity = { ...owner, id: 'e', role: 'EMPLOYEE' };
const admin: Identity = { id: 'a', email: 'a@x.fr', firstName: null, lastName: null, role: 'ADMIN', companyId: null, company: null, profilePhoto: null };

// Positionne l'identité puis résout la navigation vers `to`. Renvoie le
// pathname final (après enchaînement éventuel de redirections).
async function go(identity: Identity | null, to: string): Promise<string> {
  currentIdentity = identity;
  await router.invalidate();               // re-joue le beforeLoad racine → context.identity
  await router.navigate({ to });
  await router.invalidate();               // laisse les redirections en chaîne se résoudre
  return router.state.location.pathname;
}

beforeEach(() => {
  currentIdentity = null;
});

describe('gardes de routage — visiteur non connecté', () => {
  it.each(['/dashboard', '/stats', '/admin', '/onboarding'])('%s → /auth', async (to) => {
    expect(await go(null, to)).toBe('/auth');
  });

  it('/auth reste accessible (formulaire de connexion)', async () => {
    expect(await go(null, '/auth')).toBe('/auth');
  });
});

describe('gardes de routage — utilisateur flottant (sans entreprise)', () => {
  it('/dashboard → /onboarding (doit d\'abord rejoindre une entreprise)', async () => {
    expect(await go(floating, '/dashboard')).toBe('/onboarding');
  });

  it('/onboarding est rendu (pas de redirection)', async () => {
    expect(await go(floating, '/onboarding')).toBe('/onboarding');
  });

  it('/stats → /dashboard → /onboarding (pas OWNER)', async () => {
    expect(await go(floating, '/stats')).toBe('/onboarding');
  });

  it('/auth (déjà connecté) → renvoyé hors de /auth', async () => {
    expect(await go(floating, '/auth')).not.toBe('/auth');
  });
});

describe('gardes de routage — OWNER (entreprise rattachée)', () => {
  it('/dashboard est rendu', async () => {
    expect(await go(owner, '/dashboard')).toBe('/dashboard');
  });

  it('/stats est rendu (réservé OWNER)', async () => {
    expect(await go(owner, '/stats')).toBe('/stats');
  });

  it('/admin → /dashboard (pas ADMIN)', async () => {
    expect(await go(owner, '/admin')).toBe('/dashboard');
  });

  it('/onboarding → /dashboard (déjà rattaché)', async () => {
    expect(await go(owner, '/onboarding')).toBe('/dashboard');
  });
});

describe('gardes de routage — EMPLOYEE', () => {
  it('/dashboard est rendu', async () => {
    expect(await go(employee, '/dashboard')).toBe('/dashboard');
  });

  it('/stats → /dashboard (réservé OWNER)', async () => {
    expect(await go(employee, '/stats')).toBe('/dashboard');
  });

  it('/admin → /dashboard', async () => {
    expect(await go(employee, '/admin')).toBe('/dashboard');
  });
});

describe('gardes de routage — ADMIN', () => {
  it('/admin est rendu', async () => {
    expect(await go(admin, '/admin')).toBe('/admin');
  });

  it('/dashboard est rendu (companyId null toléré pour ADMIN)', async () => {
    expect(await go(admin, '/dashboard')).toBe('/dashboard');
  });

  it('/onboarding → /admin (un ADMIN ne s\'onboarde pas)', async () => {
    expect(await go(admin, '/onboarding')).toBe('/admin');
  });

  it('/stats → /dashboard (pas OWNER)', async () => {
    expect(await go(admin, '/stats')).toBe('/dashboard');
  });
});
