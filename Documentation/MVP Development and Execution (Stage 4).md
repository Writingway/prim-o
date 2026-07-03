# Prim'O - MVP Development & Execution (Stage 4)

> **Team:** Mario Colomas (PM / Backend) · Mateo Marques (Fullstack / SCM) · Lucas Nevano (Frontend / QA)
> **Repository:** https://github.com/Writingway/prim-o

---

## Project Overview

**Prim'O** is a B2B2C full-stack web application that lets employers reward employees
at the exact moment of performance. Employees exchange their tokens (1 token = 1 €)
for promotional codes from partner brands.

- **Backend API** - Express 5 + TypeScript, Prisma ORM, PostgreSQL (Docker).
- **Frontend** - React 19 + Vite + TypeScript + TailwindCSS, mobile-first.
- **Payments** - Stripe Checkout + signature-verified webhook (company pool top-up).
- **Transactional email** - Brevo (account verification, password reset, invitations).
- **RBAC** - 4 roles (`ADMIN`, `OWNER`, `MANAGER`, `EMPLOYEE`) with a manager
  envelope (allocation) system and strict cross-company isolation.

---

## MVP Goal

The goal of this MVP is to:

- Deliver a functional platform where an employer funds a token pool and rewards
  employees at the exact moment of performance.
- Let employees track their balance and redeem tokens (1 token = 1 €) for
  promotional codes from partner brands.
- Provide an admin back-office to manage companies, users, offers and promo codes.
- Establish a secure, API-first architecture ready for a native mobile app (V2).

---

## 0. Sprint Organisation

- **Duration:** ~1-week sprints, scoped by feature branches (`feat/*`) merged into
  `develop` through reviewed pull requests.
- **Prioritisation:** MoSCoW - the Must-have core (auth → attribution → redemption)
  was shipped first; Should-haves (admin back-office, stats, GDPR tooling) followed;
  Won't-haves stayed out (native app, token→cash conversion, multi-language).
- **Weekly rhythm:**
  - **Monday** - sprint check-in: divide the week's tasks and assign them.
  - **Wednesday** - mid-sprint code review: walk through everyone's progress.
  - **Friday** - sprint close: final check, pull requests pushed and reviewed,
    bugs inspected and triaged for the next sprint.

---

## 1. Sprints as They Actually Happened

### Foundation

Repo bootstrap, README, conventions, monorepo layout (`backend/`, `frontend/`,
`docker-compose.yml` for PostgreSQL 16 + Adminer). Velocity was low at this stage:
the team was still aligning - addressed in the retrospective.

### Sprint 1 - Auth & Skeleton

`develop` becomes the integration branch. The Prisma schema lands, followed by
project hygiene work (gitignore, env example, Postman collection) and the full
auth slice: backend register/login/refresh, then frontend login.
**Demo:** a user registers, verifies, and logs in - JWT access (15 min) + rotated
httpOnly refresh cookie (7 days).

### Sprint 2 - Employees & Attribution

Employee listing, first Manager dashboard, attribution service with atomic
Prisma transactions and non-negative balance invariant.
**Demo:** an employer attributes tokens; the employee's balance and history update.

### Sprint 3 - Admin Back-office & Payments Groundwork

Admin page and public homepage, Stripe service, admin router - users, companies,
offers, ledgers. Quality week too: the frontend API and type layers were split
into smaller testable modules, and the admin smoke-test harness was created.
**Demo:** admin CRUD on offers and companies, driven by the real database.

### Sprint 4 - Stripe, GDPR & Envelopes

Stripe checkout + webhook merged. GDPR slice: privacy service and legal pages,
Brevo mailer, anonymisation & token-cleanup background jobs. Promo-code
management, then the manager **envelope system** - OWNER allocates, MANAGER
distributes - and the OWNER stats page.
**Demo:** full lifecycle - Stripe top-up → allocation → distribution → attribution.

### Sprint 5 - Employee UX & Polish

Employee-facing frontend hardened through a series of focused merges, manager
dashboard fixes, landing page, Stripe finalisation. The remaining gaps were
closed through the current frontend Vitest suites, especially the router guard,
API client, form and ErrorBoundary coverage.
**Demo:** the complete employee journey on mobile - balance → catalogue →
redemption → promo code.

### Sprint 6 - Final QA & Release Readiness

Customisation and test passes, terminology unification ("jetons" → "tokens"
across the UI), category color-variable cleanup, documentation review against
the actual code.

---

## 2. Monitoring & Adjustments

- **Tracking:** Notion board for tasks, Discord for coordination between the
  Monday / Wednesday / Friday checkpoints; GitHub PRs as the source of truth for
  completed work (review required before merge).
- **Metrics followed:** tasks completed vs planned per sprint, PR review
  turnaround, bug count from QA passes and smoke-test runs.
- **Course corrections visible in the history:** a slow patch early in the
  project triggered a re-planning that produced the Sprint 1 push; dedicated
  `feat/fixbug` and `feat/fixfront` branches show QA feedback being absorbed
  mid-sprint rather than deferred.

### Key technical decisions & scope adjustments

Decisions made during development, visible in the code:

| Decision | Rationale |
|---|---|
| Invitation-only employee onboarding (link / company code) | No credential sharing; the employee owns their account from day one |
| Email-only verification (Brevo) - SMS dropped | An SMS provider added cost and complexity with no MVP value |
| Predefined `Motif` table instead of free-text attribution reasons | Consistent data, exploitable statistics |
| 4 roles + envelope system instead of a flat Employer/Employee split | Real companies delegate: OWNER funds the pool, MANAGERs distribute |
| Unified `User` model + `Company` (single auth path) | Auth/RBAC written once; roles are data, not tables |
| Append-only ledger (`Attribution` / `Redemption`) | Auditable token accounting; balances provable from history |
| One-off Stripe top-ups instead of subscriptions | Simpler billing for V1, same value delivered |
| Global rate limit at 300 req/min + strict per-route limiters (login, refresh, reset) | A SPA fires parallel requests; 30 req/min throttled legitimate use |

---

## 3. Sprint Reviews & Retrospective

Sprint reviews took place during the Friday session at each sprint boundary,
demoing the increments listed above, followed by bug triage for the next sprint.
Consolidated retrospective:

| Topic | Notes |
|---|---|
| ✅ What went well | Typed API layer kept front/back integration cheap; append-only ledger made token accounting reliable; PR-based workflow kept `develop` stable throughout; documenting refactors as living notes paid off immediately |
| ⚠️ What didn't | A slow start compressed the schedule; Vite served a stale module graph after `api.ts` was deleted mid-refactor (fix: dev-server restart - documented); Brevo emails landed in spam until the sender was properly verified; wording drifted ("jetons"/"tokens") and needed a late cross-codebase cleanup |
| 💡 What to improve | CI pipeline (lint + tests on every PR); automated E2E tests on the critical journeys; update planning docs as part of the Definition of Done |

---

## 4. Final Integration & QA Testing

- **End-to-end journeys verified manually** on the running stack (API :4000,
  frontend :5180): register → email verification → create/join company → Stripe
  top-up (test mode) → allocate envelope → distribute → attribution → redemption →
  promo code delivered exactly once → histories and stats consistent.
- **Smoke tests:** the backend test evidence file records the admin API coverage
  and the current integration suites cover the owner, manager, employee and
  admin paths against a live backend.
- **Stripe sandbox:** checkout session, webhook signature verification (raw body
  mounted before `express.json`), pool credited on `checkout.session.completed`,
  purchases visible in the admin ledgers.
- **Email flows tested locally:** without `BREVO_API_KEY` the backend logs the
  verification/reset links, enabling full click-tests in dev.
- **Static gates:** `tsc --noEmit` (both apps), ESLint, Vitest unit tests
  (API client, ErrorBoundary) - all green.

---

## MVP Delivery Summary

| Feature | Status | Description |
|---|---|---|
| JWT auth + rotated refresh | ✅ | 15-min access token, 7-day httpOnly refresh cookie |
| Email verification & password reset | ✅ | Brevo transactional emails |
| Invitation-based onboarding | ✅ | Link / company code, no credential sharing |
| Token attribution with motifs | ✅ | Atomic, non-negative balance, full history |
| Manager envelopes | ✅ | OWNER allocates → MANAGER distributes |
| Offer catalogue + redemption | ✅ | Promo code delivered exactly once, atomically |
| Stripe pool top-up | ✅ | Checkout + verified webhook (1 token = 1 €) |
| Admin back-office | ✅ | Users, companies, offers + images, codes, categories, ledgers |
| GDPR compliance | ✅ | Data export, account deletion, anonymisation & cleanup jobs |
| Stats dashboard (OWNER) | ✅ | Company-level indicators |

---

## Deliverables

| Deliverable | Location |
|---|---|
| Sprint planning | [`Documentation/SPRINT_PLAN.md`](SPRINT_PLAN.md) |
| Source repository | https://github.com/Writingway/prim-o |
| Testing evidence | [backend/tests/TEST_RESULT.md](../backend/tests/TEST_RESULT.md) · backend integration suites in [backend/tests/integration](../backend/tests/integration) · frontend Vitest suites in [frontend/src/components/ErrorBoundary.test.tsx](../frontend/src/components/ErrorBoundary.test.tsx), [frontend/src/services/api/client.test.ts](../frontend/src/services/api/client.test.ts), [frontend/tests/components/LoginForm.test.tsx](../frontend/tests/components/LoginForm.test.tsx), [frontend/tests/components/RegisterForm.test.tsx](../frontend/tests/components/RegisterForm.test.tsx), [frontend/tests/router/guards.test.ts](../frontend/tests/router/guards.test.ts), [frontend/tests/unit/identity.test.ts](../frontend/tests/unit/identity.test.ts) |
| QA audit | [backend/tests/MANUAL_TEST_PLAN.md](../backend/tests/MANUAL_TEST_PLAN.md) · [backend/tests/BUG_TRACKING.md](../backend/tests/BUG_TRACKING.md) |
| Refactor notes | Frontend test coverage now lives in [frontend/src/services/api/client.test.ts](../frontend/src/services/api/client.test.ts) and [frontend/src/components/ErrorBoundary.test.tsx](../frontend/src/components/ErrorBoundary.test.tsx) |
| Task board | Discord Call |
| Production environment | [add URL when deployed] |

---

## Technical Manual Review - Preparation

- ✅ Functional MVP (see delivery summary).
- ⬜ Application architecture diagram - [to add].
- ⬜ Database diagram - generate from `backend/prisma/schema.prisma`.
- ✅ GitHub repository with complete, structured, reviewed code.
- Talking points ready: unified `User`/`Company` design and the append-only ledger,
  JWT vs refresh-cookie strategy, RBAC & cross-company isolation, Stripe webhook
  security, hashing (bcrypt for passwords, SHA-256 for stored tokens), GDPR
  implementation (jobs, export, anonymisation), testing strategy, Git workflow.

---

**© 2026 - Prim'O** · Mario Colomas · Mateo Marques · Lucas Nevano
*"Your efforts rewarded instantly!"*
