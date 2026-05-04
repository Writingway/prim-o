# 🎯 Prim'O – Project README

> **Real-time bonuses.** The employer rewards, the employee earns, the motivation is immediate.

---

## 0. Team Formation

### Team Members

| Name | Role | Responsibilities |
|------|------|------------------|
| **Mario Colomas** | Project Manager / Backend Developer | Coordination, planning, API, database, business logic |
| **Mateo Marques** | Fullstack Developer | Support on both frontend and backend |
| **Lucas Nevano** | Frontend Developer | Mobile UI development, wireframes, prototypes |

### Why these roles?

We assigned roles based on what each of us already felt more comfortable with from previous projects and personal practice:

- **Mario** had the most experience working on backend logic and APIs, and was used to coordinating small group projects, so it made sense for him to handle backend and act as Project Manager.
- **Mateo** had already worked on full-stack projects (Python/Flask + React), so he took the fullstack role to help on both sides depending on what was needed.
- **Lucas** was the most interested in UI and mobile design, so he took the frontend role focused on the mobile interface.

None of us had built a React Native app before, so we agreed to learn it together as we go.

### Team Norms

- **Communication:** Discord
- **Task management:** Jira
- **Code collaboration:** GitHub — branch naming convention: `feature/`, `fix/`, `chore/`
- **Meetings:** Twice a week
- **Decision-making:** Consensus

### Stakeholders

| Stakeholder | Role | Impact on Project |
|-------------|------|-------------------|
| **Client (Prim'O) — Julien & Sandrine** | Founders / Product Owners | Define the vision, validate features, provide domain expertise |
| **Development Team** | Builds the application | Designs and delivers the entire product |
| **Partner Brands** | Distribution partners | Supply the promotional offers that give tokens their value |
| **Employers (B2B clients)** | Primary users (admin side) | Core paying customers — their UX drives adoption |
| **Employees** | End users (mobile app) | Their engagement validates the product's motivational impact |

---

## 1. Research and Brainstorming

### Individual Research

- **Mario** explored existing employee recognition platforms, JWT authentication patterns, and database schemas for transaction systems.
- **Mateo** researched the React Native ecosystem, real-time data sync strategies (WebSocket vs polling), and similar B2B SaaS apps.
- **Lucas** looked into modern mobile UI patterns, dashboard designs, and gamification visual cues used in reward apps.

### Group Brainstorming

**Mind Mapping** — themes explored together:
- **Tech stack choices**: comparing options for backend, frontend, and database to pick what fits a 3-person student team.
- **Delivery format**: discussing whether to ship a web app, a mobile app, or a PWA, and which one matches the use case best.
- **App architecture & flows**: mapping how the different parts connect — employer side, employee side, partner offers, token logic — and how data flows between them.
- **Competitor research**: looking for existing apps in the recognition / employee reward space to get inspiration and identify what to do differently.

**SCAMPER Framework** — While we did not formally apply the full SCAMPER framework, our reflection naturally followed the **Substitute** angle: replacing traditional delayed bonuses with instant tokens to fix the disconnect between effort and reward.

**"How Might We" Questions:**
1. How might we make employee recognition feel immediate and meaningful instead of delayed?
2. How might we give employers a simple, controlled way to reward performance in real time?
3. How might we transform abstract tokens into rewards employees actually want to use?

---

## 2. Idea Evaluation

### Criteria Defined

- Technical feasibility with the team's stack (React Native, Node.js, JWT)
- B2B business value and monetization potential
- Real motivational impact for end users (employees)
- Scalability from MVP to V2/V3 (admin, analytics, partner ecosystem)

### Priorities

- **MVP 🔴** → Mandatory task to make the app functional.
- **Important 🟡** → For a better experience for the user.
- **Optional 🟣** → Some add-on and extra.
- **Future 🔵** → Improve the future roadmap and scaling.

| **Feature** | **Notes** | **Feasibility** | **Risks** | **Priority** |
|---|---|:---:|:---|:---:|
| Company account creation & login | Employer signup with JWT auth | 4/5 | Implementing secure JWT + refresh token flow correctly | 🔴 |
| Employee account management | Create, list, manage employee profiles | 5/5 | None | 🔴 |
| Personal dashboard (employee) | Landing page showing current token balance | 4/5 | None | 🔴 |
| Manual token attribution | Assign tokens to a specific employee with a note | 5/5 | None | 🔴 |
| Transaction history (employer) | View past deposits and attributions | 5/5 | None | 🔴 |
| Real-time budget overview | Remaining token balance at a glance | 4/5 | Keeping the displayed balance in sync with real-time changes | 🔴 |
| Real-time token balance (employee) | Balance updates immediately after attribution | 5/5 | Choosing between WebSocket and polling strategy | 🔴 |
| Gains history (employee) | Chronological log of tokens received and reasons | 5/5 | None | 🔴 |
| Partner offers catalogue | Browse offers and their token cost | 3/5 | Depends on partner data structure being defined early with the client | 🔴 |
| Promo code redemption | Redeem tokens for a one-click promo code | 3/5 | Race conditions on stock; enforcing "one code per user per offer" at DB level | 🔴 |
| Admin back-office | Dashboard to manage companies, offers, and global stats | 3/5 | Larger scope — to plan carefully after the MVP | 🟡 |
| Push notifications | Alerts when tokens are received | 3/5 | Out of MVP scope — to re-evaluate later (native push setup on iOS + Android) | 🟡 |
| Offer targeting | Segment offers by company, role, or token tier | 2/5 | Out of MVP scope — to re-evaluate later | 🟣 |
| Rule-based token attribution | Automatic awards triggered by performance criteria | 2/5 | Out of MVP scope — to re-evaluate later | 🔵 |
| Performance analytics dashboard | Engagement and motivation metrics for employers | 2/5 | Out of MVP scope — to re-evaluate later | 🔵 |

### Risks Identified (project-wide)

| **Risk** | **Mitigation** |
|---|---|
| Authentication vulnerabilities (weak passwords, token theft, session hijacking) | JWT with 7-day expiry + refresh tokens, bcrypt password hashing (salt=12), HTTPS-only communication |
| Token fraud & duplicate redemption (an employee redeems the same code twice, or codes leak between users) | "One code per user per offer" enforced at database level, stock managed via `available` field, server-side validation on every redemption |
| API abuse & brute-force attacks (login or redemption endpoints) | Rate limiting at 30 requests / minute / IP, input validation with Zod + sanitize-html on all endpoints |

---

## 3. Decision and Refinement

- **Final MVP Selected:** **Prim'O** — a React Native mobile app enabling employers to award tokens to employees in real time, redeemable for partner brand promo codes.

- **Problem Solved:** Traditional bonuses arrive with a one-month delay, dilute in the paycheck, and break the link between effort and reward — killing the motivational impact of recognition.

- **Application Type:** Mobile application (React Native — native iOS & Android from day one).

- **Target Audience:**
  - **Primary (B2B):** SMEs and managers who want a modern, instant recognition tool for their teams.
  - **End users:** Employees who benefit from immediate, tangible rewards via partner offers.

- **Key Features (MVP):**
  - Employer onboarding with JWT authentication
  - Employee account management
  - Manual token attribution with contextual note
  - Real-time employee dashboard and balance
  - Partner offers catalogue with one-click promo code redemption
  - Transaction and gains history (both sides)

- **Expected Outcome:** A functional MVP demonstrating the full reward loop — from employer deposit to employee redemption — proving the concept of instant meritocratic recognition and validating B2B interest.

### SMART Goals

1. **Functional MVP delivery** — Deliver a working React Native MVP covering the full employer-to-employee reward loop (signup → token deposit → attribution → redemption), demonstrable on both iOS and Android.

2. **Employer subscription & token management** — Implement a subscription model where employers subscribe to a monthly plan that grants them a token allowance, with a fully functional in-app management interface (view balance, attribute tokens to employees, track transaction history).

3. **Employee redemption catalogue** — Build a partner offers catalogue and a one-click promo code redemption flow, allowing employees to exchange tokens for codes usable on partner websites — with a scalable architecture so partners can be added without code changes.

### Scope

**✅ In-Scope (V1 / MVP)**
- React Native mobile app (iOS + Android)
- Employer account creation & login (JWT)
- Employee account creation by employer
- Manual token attribution with note
- Real-time employee dashboard & balance
- Transaction & gains history
- Partner offers catalogue
- One-click promo code redemption

**❌ Out-of-Scope (deferred to V2/V3)**
- Admin back-office (multi-company management)
- Automated rule-based token attribution
- Performance analytics dashboard
- Push notifications
- Offer targeting

---

## 4. Idea Development Documentation

### Ideas Considered

This project is a **tutored project** — Prim'O was directly proposed by the client team (Julien & Sandrine). We chose to take it on because we liked both the idea itself and the project owners, so we did not brainstorm alternative project concepts.

However, we did brainstorm around **how to deliver Prim'O**:

- **Web application (React + Node)**: Rejected — the use case is mobile-first. Employees need to check tokens on the go, and employers should be able to reward performance from the field.
- **PWA (Progressive Web App)**: Rejected — less fluid experience than native, no real iOS push notifications, and a real installed app reinforces B2B legitimacy.
- **Native mobile app (React Native)**: **Selected** — best balance between native experience, cross-platform delivery (iOS + Android from one codebase), and feasibility for a 3-person team.

### Selected MVP Summary

- **Rationale:** Achievable within the project timeframe with the team's React Native and Node.js skills, addresses a real pain point in employee recognition, and offers a clear path to scale (V2 admin, V3 automation & analytics).

- **Potential Impact:** Reinforces the link between effort and reward, increases employee engagement, and gives employers a measurable motivational tool — while building a partner ecosystem with monetization potential.

### Team Overview

A 3-person team combining backend (Mario), fullstack (Mateo), and frontend/mobile (Lucas) skills. Clear role distribution, twice-weekly syncs, and consensus-based decision-making ensure smooth coordination.

---


### Steps

**Employer side:**
1. **Sign Up / Login** → employer creates a company account.
2. **Create Employees** → adds team members to the platform.
3. **Award Tokens** → manually attributes tokens to an employee with a note.

**Employee side:**
4. **Dashboard** → sees real-time token balance and gains history.
5. **Browse Offers** → explores the partner offers catalogue.
6. **Redeem** → exchanges tokens for a promo code, delivered in one click.
