# Frontend Audit — prim-o

**Date:** 2026-06-25
**Scope:** `frontend/src` (~8,900 LOC, React 19 + TypeScript + Vite 8 + Tailwind 4 + TanStack Router)
**Reviewer:** Senior frontend audit

---

## 1. Executive Summary

The frontend is **well-engineered for an early-stage product**. Authentication, token handling, and routing are thoughtfully designed with strong inline rationale (in French). TypeScript is in full strict mode with **zero `any` / `@ts-ignore`** across the codebase — rare and commendable.

The main risks are **operational, not architectural**: there are **no automated tests**, **ESLint silently ignores all `.ts`/`.tsx` files**, and there is **no error boundary**. Several page components have grown large (400–600 LOC) and mix data-fetching, state, and rendering.

**Overall grade: B+.** Solid foundation, a few high-leverage gaps to close before scaling the team.

---

## 2. Stack & Structure

| Area | Choice |
|------|--------|
| Framework | React 19.2 |
| Router | TanStack Router 1.17 (identity-aware guards) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Build | Vite 8 + `tsc -b` |
| State/data | Manual `useState` + `useEffect` + custom hooks (no react-query/zustand) |
| Tests | **None** |

Folder layout is clean and conventional:

```
src/
  pages/        route screens (Admin, Owner, Manager, Employee, Auth, Stats…)
  components/   ui, layout, auth, dashboard, admin, offers, allocation, privacy
  hooks/        12 custom hooks (useEmployeeDashboard, usePromoCodes, useIsDesktop…)
  services/api/ domain-split API layer behind a barrel (index.ts)
  types/        shared typed contracts
  lib/          format, avatars helpers
```

This separation (pages → components → hooks → services) is correct and easy to navigate.

---

## 3. Strengths

1. **Auth transport layer is excellent** — [services/api/client.ts](src/services/api/client.ts)
   - Access token kept **in memory only**, never `localStorage` (XSS-safe).
   - Refresh is a **singleton promise** — concurrent 401s share one refresh, avoiding token-reuse detection / family revocation.
   - 401 → refresh → retry **once**, and only logs out on genuine auth failure (401/403), not on 429/5xx/network blips. This is a subtle correctness point most teams get wrong.

2. **Identity as single source of truth** — [services/api/identity.ts](src/services/api/identity.ts). Role read from `GET /auth/me` (DB), not decoded client-side from JWT. Short 30s TTL cache prevents spamming on navigation/preload, invalidated explicitly on login/logout.

3. **Strict TypeScript** — `strict`, `noUnusedLocals`, `noUnusedParameters` all on. Zero escape hatches in the codebase.

4. **Domain-split API behind a barrel** — components import from `../services/api`; internal split (auth, offers, stats, admin…) can evolve without touching callers.

5. **Documented intent** — non-trivial decisions carry *why* comments (cache, refresh, no-store, redirect rules). High maintainability signal.

---

## 4. Findings (prioritized)

### 🔴 High

- ✅ **DONE — ESLint now lints TypeScript.** [eslint.config.js](eslint.config.js) extends `typescript-eslint` recommended + `react-hooks` over `**/*.{ts,tsx}`. `npm run lint` covers the real source.

- ✅ **DONE — Vitest added, auth transport covered.** [client.test.ts](src/services/api/client.test.ts) locks the 5 subtle `authRequest` branches (refresh singleton, 401→refresh→retry, no-logout on 429/5xx, logout on auth-fail, no 2nd retry). [ErrorBoundary.test.tsx](src/components/ErrorBoundary.test.tsx) covers fallback + passthrough. `npm test` → 7 passing. Router guards still uncovered.

- ✅ **DONE — Top-level error boundary.** [ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) wraps `<App>` in [main.tsx](src/main.tsx); render throws show a recovery screen instead of a blank app. `componentDidCatch` is the hook-point for a logger (Sentry) later.

### 🟡 Medium

- **Large multi-responsibility pages.** Top offenders:
  | File | LOC | Status |
  |------|-----|--------|
  | [pages/StatsPage.tsx](src/pages/StatsPage.tsx) | 519 | ✅ data logic extracted → [useStats.ts](src/hooks/useStats.ts) |
  | [components/offers/OfferCatalog.tsx](src/components/offers/OfferCatalog.tsx) | 589 | pending |
  | [pages/OwnerDashboard.tsx](src/pages/OwnerDashboard.tsx) | 531 | pending |
  | [pages/AdminPage.tsx](src/pages/AdminPage.tsx) | 423 | pending |
  | [pages/ManagerDashboard.tsx](src/pages/ManagerDashboard.tsx) | 414 | pending |

  These mix data fetching, local state, and rendering. Extract data logic into hooks (the pattern already exists — `useEmployeeDashboard`, `useAdminOffers`, now `useStats`) and split presentational sub-components.

- **Hand-rolled data fetching.** `useState`/`useEffect` fetching across 13 files means manual loading/error/refetch/caching in each. As screens multiply this duplicates logic and invites race/stale bugs.
  *Consider:* TanStack Query (already in the TanStack ecosystem) for caching, dedupe, and retry — would also simplify the 30s identity cache.

- **Single Tailwind-only design, no test of responsive logic.** `useIsDesktop` drives branching render (mobile splash vs desktop landing). This desktop/mobile fork is untested and was the subject of recent churn (per git history) — prime candidate for at least a smoke test.

### 🟢 Low / Polish

- **Accessibility is thin.** Only 34 `aria-*`/`alt` occurrences across ~70 components. Audit interactive controls (icon buttons, dialogs, nav) for labels and focus management. [components/ui/ConfirmDialog.tsx](src/components/ui/ConfirmDialog.tsx) should trap focus and be `role="dialog"` + `aria-modal`.
- **Mixed-language codebase.** Comments and some UI strings are French; types/identifiers English. Fine internally, but no i18n layer — hardcoded strings will block localization later.
- **No `.env.example`.** Only `VITE_API_URL` is consumed; document it.

---

## 5. Recommended Next Steps

| Priority | Action | Effort | Status |
|----------|--------|--------|--------|
| 1 | Fix ESLint to cover `.ts`/`.tsx` + add `typescript-eslint` | S | ✅ done |
| 2 | Add Vitest; cover `client.ts` refresh/retry + route guards | M | ✅ `client.ts` done; route guards pending |
| 3 | Add top-level error boundary | S | ✅ done |
| 4 | Extract fetch logic from 400+ LOC pages into hooks/subcomponents | M | 🔶 StatsPage done; 4 pages left |
| 5 | Evaluate TanStack Query to replace manual fetch effects | M | pending |
| 6 | Accessibility pass on dialogs, icon buttons, nav | M | pending |

**Bottom line:** architecture and auth are strong; close the testing/linting/error-handling gaps before adding more screens or developers.
