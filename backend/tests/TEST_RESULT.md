# Prim'O - Backend Test Results

**Date:** 2026-07-03
**Stack:** Vitest + Supertest (TypeScript, ts-node)
**Scope:** backend API (`backend/src`), 62 production endpoints + Stripe webhook
**Status:** ✅ **98 / 98 backend passing** (20 unit + 78 integration) + ✅ **45 / 45 frontend passing** (see section 7)

---

## 1. What we test and why

We follow the two lowest levels of the classic testing pyramid (see
[Guru99 - Software Testing](https://www.guru99.com/software-testing.html),
section *Levels of Testing*):

| Level | Question it answers | Here |
|-------|---------------------|------|
| **Unit testing** | Does one function behave in isolation? | pure logic: JWT, hashing, Zod schemas, sanitization - no DB, no network |
| **Integration testing** | Do the pieces work together through a real HTTP request? | full Express app + real Postgres, driven by Supertest |

- **Unit** (`npm test`) - fast (~0.3 s), no dependencies. Runs anywhere (CI, no DB).
- **Integration** (`npm run test:int`) - boots the real app in-process (no port),
  hits a **dedicated `primo_test` database** that is reset and seeded before every
  run. The dev database is never touched.

Both are **automated** and **repeatable**. The old manual shell scripts
(`smoke.sh` and `admin/run.sh`) and the whole `tests/admin/` folder are **removed** -
every case they covered is now a Vitest test under `unit/` or `integration/`.
The test tree is:

```
backend/tests/
  unit/          3 files - pure logic, no DB
  integration/   8 files - real app + real DB (Supertest)
  test_result.md this document
  BUG_TRACKING_AND_TEST_EVIDENCE.md  bug history
```

---

## 2. How to run

```bash
cd backend

npm test          # unit tests (no DB needed)
npm run test:int  # integration tests (needs the Postgres Docker container up)
```

Integration setup is automatic: `tests/integration/global-setup.ts` runs
`prisma db push --force-reset` + `prisma db seed` on `primo_test` before the suite.

---

## 3. Unit tests (20) - `backend/tests/unit/`

Pure business logic, no I/O.

| File | Tests | Covers |
|------|-------|--------|
| `token.test.ts` | 8 | JWT sign/verify round-trip, tampered token rejected, forged-secret rejected, floating user (role null), sha256 refresh-token hashing, 3 token generators (64-hex, unique) |
| `admin.schemas.test.ts` | 8 | `updateUserSchema` (empty body -> fail, ADMIN promotion blocked, old `status` contract rejected), `companyStatusSchema`, `idParamSchema`, pagination coercion + bounds |
| `validation.test.ts` | 4 | `safeText` strips HTML/XSS, trims, rejects empty-after-sanitize |

**Security highlights caught by unit tests:**
- Privilege escalation: cannot promote a user to `ADMIN` through the update schema.
- XSS: `<script>` and `onerror` payloads stripped before they reach the DB.
- Token integrity: a token signed with the wrong secret is rejected.

---

## 4. Integration tests (78) - `backend/tests/integration/`

Real HTTP requests against the real app + DB.

| File | Tests | Endpoints exercised |
|------|-------|---------------------|
| `onboarding.test.ts` | 9 | register -> verify -> login -> create-company (PENDING) -> checkout blocked 403 -> admin approve -> invite -> join -> double-join 409 |
| `auth.test.ts` | 14 | register (400/409), login (401), `/me` (401/200), refresh cookie flow, logout 204, resend/forgot (silent 200), reset-password (401), verify-email redirect |
| `admin.test.ts` | 8 | auth guards (401/403), pagination, role promote/revert, empty body 400, old `status` contract 400, self-modification 400 |
| `attribution.test.ts` | 11 | allocate (201/403), envelopes, incomplete distribution 422, complete 201, double-distribution 409, managers/balances/sent-envelopes/history reads |
| `catalog.test.ts` | 9 | public offers + categories, admin offer CRUD, promo-code add/list/delete, category CRUD, validation 400/401 |
| `employee.test.ts` | 9 | balance, received/spent history, redeem offer 201, owner-cannot-redeem 403, mark-used 200, employee list, 401 guard |
| `privacy.test.ts` | 7 | RGPD profile read/update, empty-body 400, data export, delete with wrong/right password (401/204), 401 guard |
| `misc.test.ts` | 11 | company, stats, motifs, admin dashboard + ledgers (stats/companies/attributions/redemptions/purchases/categories), company soft-delete + restore |

**Critical paths proven end-to-end:**
- **Onboarding** (account-first, email-verification gated).
- **Money path**: employer -> manager allocation -> manager -> employee distribution,
  including the atomic "total must equal envelope" rule (422) and single-use envelope (409).
- **Token spend**: employee redeems an offer, claims a promo code, marks it used.
- **RGPD**: export + account anonymization confirmed by password.

---

## 5. Bugs found by these tests

Writing the endpoint tests surfaced **2 real backend bugs** (both account-first
refactor drift), now fixed and covered by a regression test:

| ID | Severity | Endpoint | Bug | Fix |
|----|----------|----------|-----|-----|
| BUG-5 | 🔴 High | `GET /api/me/export` | Selected a dropped `User.status` field -> Prisma crash -> **500 for every user**. RGPD data export fully broken. | Removed the dead field from `privacy.service.ts` |
| BUG-6 | 🟡 Low | `GET /api/offers/:id` | Malformed uuid passed straight to Prisma -> **500** instead of a clean 400 (inconsistent with admin routes) | Validate the uuid in the controller before the query |

See [BUG_TRACKING_AND_TEST_EVIDENCE.md](BUG_TRACKING_AND_TEST_EVIDENCE.md) for the
full history (BUG-1 through BUG-4).

---

## 6. Known coverage gaps (deliberate)

Not every endpoint is auto-tested; 4 need infrastructure out of scope for this pass:

| Endpoint | Why deferred |
|----------|--------------|
| `PATCH /admin/offers/:id/image`, `DELETE .../image` | multipart file upload - needs fixture images + multer harness |
| `POST /stripe/webhook` | requires a valid Stripe signature - needs the Stripe test SDK to forge events |
| `POST /attributions/` (direct attribution) | superseded in practice by the envelope/distribute flow, which is covered |
| `DELETE /employees/:id` | destructive; the reversible admin soft-delete/restore path is covered instead |

Everything else - **~58 of 62 endpoints** - is exercised by the suites above.

---

## 7. Frontend tests (45) - `frontend/`

**Stack:** Vitest + @testing-library/react + jsdom.
**Run:** `cd frontend && npm test` (no backend or DB needed - the API layer is mocked).

Same pyramid as the backend: pure-logic units, then component/integration tests
that mount real React components with the network stubbed.

| File | Tests | Layer | Covers |
|------|-------|-------|--------|
| `src/services/api/client.test.ts` | 5 | unit | auth request lifecycle: single shared refresh promise, 401 -> refresh -> retry once, refresh 429 does NOT log out (transient), refresh 401 logs out, retry-still-401 logs out |
| `tests/unit/identity.test.ts` | 7 | unit | `normalizeRole` (MAJ -> min, null), `getIdentity` cache: 200 cached, 401 caches null, **429/500 NOT cached (transient failure must not poison identity)**, `clearIdentityCache` forces refetch |
| `tests/components/LoginForm.test.tsx` | 6 | component | ok -> `onLoginSuccess(token)`, 200 without token -> error + no callback, 401/403 messages, EMAIL_NOT_VERIFIED shows resend link, network-down message, forgot-password anti-enumeration notice |
| `tests/components/RegisterForm.test.tsx` | 5 | component | consent gate blocks submit (register never called), 409 email-taken, 400 surfaces first backend validation message, 400 fallback, success -> `onSuccess()` |
| `tests/router/guards.test.ts` | 20 | integration | full `beforeLoad` redirect matrix (visitor / floating / OWNER / EMPLOYEE / ADMIN) x (`/dashboard` `/stats` `/admin` `/onboarding` `/auth`), driven through the real TanStack router |
| `src/components/ErrorBoundary.test.tsx` | 2 | component | renders fallback on child throw, renders children when healthy |

**Why these first:** the router guards were the weakest untested layer. The
guard suite proves every auth/role redirect end-to-end against the real router
- a logged-out user can never reach `/dashboard`, a floating user is forced
through `/onboarding`, `/stats` is OWNER-only, `/admin` is ADMIN-only. The
identity + client suites lock in the same transient-failure hardening proven on
the backend (a 429/5xx must never log the user out or blank their identity).

---

## 8. Summary

- ✅ 98 backend + 45 frontend automated tests, 100% passing.
- ✅ Every critical business path (onboarding, money movement, token spend, RGPD) proven end-to-end.
- ✅ Frontend auth/role routing guards proven against the real router.
- ✅ 2 production bugs found and fixed before reaching users.
- ✅ Runs on a throwaway database; safe to run in CI.
