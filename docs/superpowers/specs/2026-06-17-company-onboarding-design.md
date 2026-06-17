# Company Onboarding Redesign — Account-First

**Date:** 2026-06-17
**Status:** Approved (design)

## Problem

Current registration creates a Company + OWNER user in a single call. Two problems:

1. **Conflated concerns.** A user's identity and their membership in a company are coupled into one action. Not a sound model — a person is a user; belonging to a company is separate.
2. **Lockout bug.** The OWNER user is created with `status` defaulting to `PENDING`, so the owner cannot log in to their own account until an admin manually flips it.

## Decision

Move to **account-first onboarding** (standard SaaS pattern — Slack/Notion/Linear): identity ≠ org membership.

A user registers/logs in as a plain user. A user with no company lands on a choice screen: **Créer une entreprise** or **Rejoindre une entreprise**.

**Scope guard:** single-company membership is kept. `User.companyId` stays a single nullable FK. No many-to-many `Membership` join table — multi-org is not a requirement and that refactor would touch every `companyId` reference (YAGNI).

## Design

### 1. Schema (Prisma migration)

- `User.role` → **nullable**. `null` = floating user, not yet in a company.
- `User.companyId` — already nullable. Relax the "null only for ADMIN" rule: `null` = ADMIN **or** not-yet-joined.
- Floating user state: `role = null`, `companyId = null`, `status = APPROVED`. Identity is valid immediately; company capability is gated on `Company.status`, not user status.

State semantics, kept distinct:
- `User.status` — used for **employees** awaiting *manager* approval (unchanged).
- `Company.status` — company awaiting *admin* approval. The real gate for owner/company capability.

### 2. Auth endpoints (replace the old two)

- `POST /auth/register` — creates a floating user, returns tokens → logged in immediately.
- `POST /auth/create-company` *(authenticated)* — creates a `PENDING` company, sets caller `role = OWNER`, `companyId`.
- `POST /auth/join-company` *(authenticated)* — invite-code path; sets `role = EMPLOYEE` (or the code's role), `companyId`, and user status per the existing invite flow. Adapts current `registerUser`.
- Old `POST /auth/register-company` and `POST /auth/register-user` are removed.

### 3. Routing after login (frontend)

- `companyId == null` → **onboarding screen: Créer une entreprise / Rejoindre une entreprise.**
- Has a company → dashboard, gated on `Company.status`:
  - `PENDING` → banner *"Company under review — an admin will approve soon."* Allowed: view dashboard, edit profile + company name. Greyed with "available after approval": buy tokens, invite employees, create attributions.
  - `APPROVED` → full dashboard.
  - `REJECTED` → blocked state, "company rejected" message.

### 4. `/me` endpoint

Returns `role`, `companyId`, and `company.status` so the frontend can route correctly.

### 5. Backend guards (defense in depth — do not trust the frontend)

Company actions (buy tokens / invite employees / create attribution) require:
`companyId != null` + appropriate role + `Company.status === APPROVED`.
Otherwise `403 COMPANY_NOT_APPROVED`.

### 6. Admin approve/reject (AdminCompanies frontend deltas)

Status badge + Approve/Reject buttons.
- Approve → `Company.status = APPROVED`. Owner already usable; nothing else needed.
- Reject → `Company.status = REJECTED`.

### 7. Testing (smoke.sh)

- register (floating) → login → create-company → buy tokens (expect **403**, company PENDING) → admin approve → buy tokens (expect **200**).
- register → join-company with invite code → employee dashboard.

## Open checks before implementation

- Confirm whether `admin.service` already has approve/reject and what it sets.
- Confirm `/me`-style endpoint exists and what it currently returns.
