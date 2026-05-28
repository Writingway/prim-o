# Prim'O — Stage 2: Project Planning

**Date:** May 5, 2026  
**Team:** Mario Colomas (PM/Backend), Mateo Marques (Fullstack), Lucas Nevano (Frontend)

---

## Project Timeline & Phases

**Duration:** 10 weeks | **Goal:** Build and deploy MVP V1

| Phase | Duration | Focus | Owner(s) |
|-------|----------|-------|----------|
| **1. Foundation** | Weeks 1-2 | API setup, database schema, JWT auth | Mario |
| **2. Employer Portal** | Weeks 3-4 | Signup, company profile, employee management | Mario + Mateo + Lucas |
| **3. Token System** | Weeks 5-6 | Deposits, attribution, transaction history | Mario + Mateo |
| **4. Employee App** | Weeks 7-8 | Dashboard, offers, redemption flow | Lucas + Mateo |
| **5. Testing & Deploy** | Weeks 9-10 | Integration, partner codes, production launch | Mario + Mateo + Lucas |

---

## User Stories by Developer

### Mario Colomas (Backend/PM)

| Phase | Story | Description |
|-------|-------|-------------|
| 1 | US-001 | REST API setup with middleware & error handling |
| 1 | US-002 | PostgreSQL schema: Employer, Employee, Transaction, Offer, PromoCode, ExchangeHistory |
| 1 | US-003 | JWT auth: token generation, refresh flow, bcrypt hashing |
| 2 | US-004 | Employer signup & login endpoints |
| 2 | US-005 | Company profile API (CRUD) |
| 2 | US-006 | Employee creation endpoint (employer creates) |
| 2 | US-007 | Employee self-registration via invitation link |
| 3 | US-008 | Token deposit endpoint (1€ = 1 token) |
| 3 | US-009 | Manual token attribution endpoint |
| 3 | US-010 | Transaction history endpoints (employer & employee) |
| 4 | US-011 | Partner offers CRUD endpoints |
| 4 | US-012 | Token redemption logic & promo code assignment |
| 5 | US-013 | Real-time balance updates (< 1 sec response) |

### Mateo Marques (Fullstack)

| Phase | Story | Description |
|-------|-------|-------------|
| 2 | US-014 | Employer signup/login form with validation |
| 2 | US-015 | Employer dashboard layout & token balance display |
| 2 | US-016 | Company profile edit form |
| 3 | US-017 | Token deposit form & confirmation |
| 3 | US-018 | Award tokens form (employee selection, amount, reason) |
| 4 | US-019 | Employee login form & session management |
| 4 | US-020 | Employee dashboard with real-time balance |
| 4 | US-021 | Token history list/table component |
| 5 | US-022 | Input validation & sanitization (Zod + sanitize-html) |

### Lucas Nevano (Frontend)

| Phase | Story | Description |
|-------|-------|-------------|
| 2 | US-023 | Employee management table (sortable, filterable) |
| 2 | US-024 | Employee creation/invitation form |
| 4 | US-025 | Employee dashboard main layout (mobile-first) |
| 4 | US-026 | Offers catalogue with filtering (category, token cost) |
| 4 | US-027 | Offer detail page |
| 4 | US-028 | Redemption flow (selection, confirmation, code display) |
| 4 | US-029 | Redemption history |
| 5 | US-030 | Responsive design (mobile/tablet/desktop) |
| 5 | US-031 | UI polish & accessibility (WCAG A level) |

---

## Milestones

| M# | Phase | Target | Deliverable |
|----|-------|--------|-------------|
| M1 | 1 | Week 2 | API with auth & database schema ready |
| M2 | 2 | Week 4 | Employer portal working (signup, login, employees) |
| M3 | 3 | Week 6 | Token system live (deposit, award, history) |
| M4 | 4 | Week 8 | Employee app complete (dashboard, offers, redemption) |
| M5 | 5 | Week 10 | MVP deployed to production |

---

## Critical Dependencies

| Item | Owner | Status |
|------|-------|--------|
| Database schema | Mario | Must complete before API dev |
| JWT auth | Mario | Blocks all authenticated features |
| Employer API endpoints | Mario | Blocks employer UI development |
| Employee API endpoints | Mario | Blocks employee UI development |
| Partner promo codes | Prim'O team | Needed by end of Phase 4 |

---

## Success Criteria

**Functional:** All must-have features complete. Employer can manage employees & tokens. Employee can log in, view balance, redeem tokens.

**Performance:** API response < 2 sec. Balance updates < 1 sec. Web app loads < 3 sec on mobile 4G.

**Security:** Passwords hashed (bcrypt). JWT secure. Input validated & sanitized. HTTPS in production.

**UX:** Mobile-first responsive design. Consistent styling. Clear error messages. Intuitive flows.

**Team:** Weekly sync, code reviews on all PRs, blockers resolved within 24h.

---

## Next Steps

1. Finalize user story estimates (story points per developer)
2. Create tasks in Notion
3. Set up GitHub repositories & branch conventions
4. Kick off Phase 1
