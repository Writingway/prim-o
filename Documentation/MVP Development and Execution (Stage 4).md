# Prim'O — MVP Development & Execution (Stage 4)

> **Team:** Mario Colomas (PM / Backend) · Mateo Marques (Fullstack / SCM) · Lucas Nevano (Frontend / QA)
> **Repository:** https://github.com/Writingway/prim-o
> **Development window:** April 30 → July 2026

---

## Project Overview

**Prim'O** is a B2B2C full-stack web application that lets employers reward employees
at the exact moment of performance. Employees exchange their tokens (1 token = 1 €)
for promotional codes from partner brands.

- **Backend API** — Express 5 + TypeScript, Prisma ORM, PostgreSQL (Docker).
- **Frontend** — React 19 + Vite + TypeScript + TailwindCSS, mobile-first.
- **Payments** — Stripe Checkout + signature-verified webhook (company pool top-up).
- **Transactional email** — Brevo (account verification, password reset, invitations).
- **RBAC** — 4 roles (`ADMIN`, `OWNER`, `MANAGER`, `EMPLOYEE`) with a manager
  envelope (allocation) system and strict cross-company isolation.

---

## 0. Sprint Organisation

- **Duration:** ~1-week sprints, scoped by feature branches (`feat/*`) merged into
  `develop` through reviewed pull requests.
- **Prioritisation:** MoSCoW — the Must-have core (auth → attribution → redemption)
  was shipped first; Should-haves (admin back-office, stats, GDPR tooling) followed;
  Won't-haves stayed out (native app, token→cash conversion, multi-language).
- **Roles:** PM (Mario) — sprint scoping and arbitration; SCM (Mateo) — Git workflow
  and PR reviews; QA (Lucas) — manual test passes and UI review. All three also
  delivered code: Mario on API/DB/business rules, Lucas on UI/UX, Mateo on
  frontend↔backend integration and tests.

---

## 1. Sprints as They Actually Happened

Reconstructed from the merge history on `develop`.

### Foundation — Apr 30 → May 19

Repo bootstrap, README, conventions, monorepo layout (`backend/`, `frontend/`,
`docker-compose.yml` for PostgreSQL 16 + Adminer). Velocity was low at this stage:
the team was still aligning — addressed in the retrospective.

### Sprint 1 — Auth & Skeleton (May 20 → Jun 1)

`develop` becomes the integration branch. The Prisma schema lands (May 27),
followed by project hygiene work (gitignore, env example, Postman collection)
and the full auth slice: backend register/login/refresh, then frontend login.
**Demo:** a user registers, verifies, and logs in — JWT access (15 min) + rotated
httpOnly refresh cookie (7 days).

### Sprint 2 — Employees & Attribution (Jun 2 → Jun 8)

Employee listing, first Manager dashboard (Jun 4), attribution service with
atomic Prisma transactions and non-negative balance invariant (Jun 8).
**Demo:** an employer attributes tokens; the employee's balance and history update.

### Sprint 3 — Admin Back-office & Payments Groundwork (Jun 9 → Jun 15)

Admin page and public homepage (Jun 9), Stripe service (Jun 11),
admin router — users, companies, offers, ledgers (Jun 12). Quality week too:
the 403-line `api.ts` was split into a typed per-domain client, `types.ts` split
by domain (both refactors documented in `frontend/tests/*-refactor.md`), and the
admin smoke-test harness `tests/admin/run.sh` was created (Jun 15).
**Demo:** admin CRUD on offers and companies, driven by the real database.

### Sprint 4 — Stripe, GDPR & Envelopes (Jun 16 → Jun 22)

Stripe checkout + webhook merged (Jun 16). GDPR slice: privacy service and
legal pages (Jun 17), Brevo mailer, anonymisation & token-cleanup background jobs
(Jun 18). Promo-code management, then the manager **envelope system** —
OWNER allocates, MANAGER distributes (Jun 22) — and the OWNER stats page.
**Demo:** full lifecycle — Stripe top-up → allocation → distribution → attribution.

### Sprint 5 — Employee UX & Polish (Jun 23 → Jun 29)

Employee-facing frontend hardened through a series of focused merges, manager
dashboard fixes, landing page (Jun 25), Stripe finalisation (Jun 29). A dedicated
frontend audit (`Documentation/audit/FRONTEND_AUDIT.md`, Jun 29) tracked the
remaining gaps (ESLint config, Vitest, ErrorBoundary, toasts) to closure.
**Demo:** the complete employee journey on mobile — balance → catalogue →
redemption → promo code.

### Sprint 6 — Final QA & Release Readiness (Jun 30 → Jul)

Customisation and test passes, terminology unification ("jetons" → "tokens"
across the UI), category color-variable cleanup, documentation review against
the actual code.

---

## 2. Monitoring & Adjustments

- **Tracking:** Notion board for tasks, Discord for daily coordination; GitHub PRs
  as the source of truth for completed work (review required before merge).
- **Metrics followed:** tasks completed vs planned per sprint, PR review
  turnaround, bug count from QA passes and smoke-test runs.
- **Course corrections visible in the history:** a slow patch in mid-May triggered
  a re-planning that produced the Sprint 1 push; dedicated `feat/fixbug` and
  `feat/fixfront` branches (Jun 19-22) show QA feedback being absorbed
  mid-sprint rather than deferred.

### Key technical decisions & scope adjustments

Decisions made during development, visible in the code:

| Decision | Rationale |
|---|---|
| Invitation-only employee onboarding (link / company code) | No credential sharing; the employee owns their account from day one |
| Email-only verification (Brevo) — SMS dropped | An SMS provider added cost and complexity with no MVP value |
| Predefined `Motif` table instead of free-text attribution reasons | Consistent data, exploitable statistics |
| 4 roles + envelope system instead of a flat Employer/Employee split | Real companies delegate: OWNER funds the pool, MANAGERs distribute |
| Unified `User` model + `Company` (single auth path) | Auth/RBAC written once; roles are data, not tables |
| Append-only ledger (`Attribution` / `Redemption`) | Auditable token accounting; balances provable from history |
| One-off Stripe top-ups instead of subscriptions | Simpler billing for V1, same value delivered |
| Global rate limit at 300 req/min + strict per-route limiters (login, refresh, reset) | A SPA fires parallel requests; 30 req/min throttled legitimate use |

---

## 3. Sprint Reviews & Retrospective

Reviews were held at each sprint boundary on the demos listed above.
Consolidated retrospective:

| Topic | Notes |
|---|---|
| ✅ What went well | Typed API layer kept front/back integration cheap; append-only ledger made token accounting reliable; PR-based workflow kept `develop` stable throughout; documenting refactors as living notes paid off immediately |
| ⚠️ What didn't | A slow start compressed the schedule; Vite served a stale module graph after `api.ts` was deleted mid-refactor (fix: dev-server restart — documented); Brevo emails landed in spam until the sender was properly verified; wording drifted ("jetons"/"tokens") and needed a late cross-codebase cleanup |
| 💡 What to improve | CI pipeline (lint + tests on every PR); automated E2E tests on the critical journeys; update planning docs as part of the Definition of Done |

---

## 4. Final Integration & QA Testing

- **End-to-end journeys verified manually** on the running stack (API :4000,
  frontend :5180): register → email verification → create/join company → Stripe
  top-up (test mode) → allocate envelope → distribute → attribution → redemption →
  promo code delivered exactly once → histories and stats consistent.
- **Smoke tests:** `bash tests/admin/run.sh` replays every `/api/admin` endpoint
  (nominal + 400/401/403/404 cases) against a live backend; captured output is
  committed as `RESULTS.md` (testing evidence).
- **Stripe sandbox:** checkout session, webhook signature verification (raw body
  mounted before `express.json`), pool credited on `checkout.session.completed`,
  purchases visible in the admin ledgers.
- **Email flows tested locally:** without `BREVO_API_KEY` the backend logs the
  verification/reset links, enabling full click-tests in dev.
- **Static gates:** `tsc --noEmit` (both apps), ESLint, Vitest unit tests
  (API client, ErrorBoundary) — all green.

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
| Testing evidence | [`backend/tests/admin/RESULTS.md`](../backend/tests/admin/RESULTS.md) · Vitest suites in `frontend/src` |
| QA audit | [`Documentation/audit/FRONTEND_AUDIT.md`](audit/FRONTEND_AUDIT.md) |
| Refactor notes | [`frontend/tests/api-refactor.md`](../frontend/tests/api-refactor.md) · [`type-refactor.md`](../frontend/tests/type-refactor.md) |
| Task board | Notion — [add link] |
| Production environment | [add URL when deployed] |

---

## Technical Manual Review — Preparation

- ✅ Functional MVP (see delivery summary).
- ⬜ Application architecture diagram — [to add].
- ⬜ Database diagram — generate from `backend/prisma/schema.prisma`.
- ✅ GitHub repository with complete, structured, reviewed code.
- Talking points ready: unified `User`/`Company` design and the append-only ledger,
  JWT vs refresh-cookie strategy, RBAC & cross-company isolation, Stripe webhook
  security, hashing (bcrypt for passwords, SHA-256 for stored tokens), GDPR
  implementation (jobs, export, anonymisation), testing strategy, Git workflow.

---

**© 2026 — Prim'O** · Mario Colomas · Mateo Marques · Lucas Nevano
*"Your efforts rewarded instantly!"*
