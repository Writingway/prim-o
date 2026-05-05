# Prim'O — *Your efforts rewarded instantly!*

> **Real-time rewards.** The employer gives, the employee earns, the motivation is immediate.

---

## Table of Contents

- [About](#about)
- [Project Overview](#project-overview)
- [Business Model](#business-model)
- [Team Formation](#team-formation)
- [Stakeholders](#stakeholders)
- [Architecture Decisions](#architecture-decisions)
- [MVP Features](#mvp-features)
- [Technical Requirements](#technical-requirements)


---

## About

**Prim'O** is a B2B2C application that enables employers to reward their employees **at the exact moment of performance**, and allows employees to exchange their tokens for promotional codes from major partner brands.

PRIM'O positions itself as the **first meritocratic works council (CE) for SMEs/VSEs**: unlike meal vouchers or quarterly bonuses, PRIM'O directly ties individual performance to an immediate and tangible reward.

### The Problem

Traditional bonuses arrive too late to genuinely motivate. They get lost in the paycheck, come after the effort, and lose all motivational effect. Behavioral psychology confirms it: **a reward must be immediate to be effective**.

### The Solution

A **meritocratic reverse reward pool**: the company funds it, the employee earns, and motivation is instantaneous.

| Actor | Action |
|-------|--------|
| Employer | Awards tokens at the moment of performance |
| Employee | Sees their earnings in real time on their interface |
| Tokens | Exchanged for gift vouchers from partner brands (100 tokens = 100€) |

### Key Mechanics (V1)

1. The employer creates a company account
2. They create employee accounts — or the employee self-registers via invitation link / company code
3. **Double validation** by email/SMS from both parties before account activation
4. They deposit money → converted into tokens (1€ = 1 token in V1)
5. They manually assign tokens to their employees via the interface
6. The employee sees their tokens credited in real time
7. The employee redeems tokens for a partner promo code (delivered in one click)

---

## Project Overview

| | |
|---|---|
| **Project Name** | Prim'O |
| **Tagline** | Your efforts rewarded instantly! |
| **Version** | V1 |
| **Status** | In development |
| **Started** | 21/04/2026 |

---

## Business Model

The model rests on two components:

| Component | Detail |
|-----------|--------|
| **Monthly subscription** | Includes a minimum token volume allocated by the employer |
| **Additional tokens** | Option to purchase extra tokens at any time as needed |

**Merchant partners**: PRIM'O negotiates promotional codes upfront with major brands (Cdiscount, Fnac, Samsung, etc.). These codes are stored in the database and automatically delivered to the employee when they redeem their tokens.

> PRIM'O tokens do not constitute electronic money in the regulatory sense. They are equivalent to employee benefits, redeemable only against predefined partner offers. **No token-to-real-money conversion must ever be possible.**

---

## Team Formation

### Team Members

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Mario Colomas** | Project Manager / Backend Developer | Coordination, planning, client communication, API, database, business logic |
| **Mateo Marques** | Fullstack Developer | Front & back support |
| **Lucas Nevano** | Frontend Developer | Mobile UI, wireframes, prototypes, user experience |

### Team Norms

- **Communication:** Discord
- **Task management:** Notion
- **Code collaboration:** GitHub — branch naming: `feature/`, `fix/`, `chore/`
- **Meetings:** 2x per week
- **Decision-making:** Consensus

---

## Stakeholders

| Stakeholder | Role | Impact on Project |
|-------------|------|-------------------|
| **Julien & Sandrine (Prim'O)** | Founders / Product Owners | Define the vision, validate features, provide domain expertise |
| **Development Team** | Project team | Builds and delivers the entire product |
| **Merchant partners** | Distribution partners | Supply the offers that give tokens their value |
| **Employers (B2B clients)** | Primary users (back-office) | Core paying customers — their UX drives adoption |
| **Employees** | End users (mobile) | Their engagement validates the product's motivational impact |

---

## Architecture Decisions

### Mobile-first web app — no native app in V1

**Confirmed decision**: PRIM'O V1 is a **responsive web app**, mobile-first, accessible from both mobile and desktop browsers.

**Why not React Native or a native app?**

A native mobile app operates through **system layers** (direct hardware access, OS-native navigation) rather than **HTTP requests**. Building native from V1 would:
- complicate the architecture without adding value for this spec
- slow down development and deployment
- go beyond what the client requires (spec: *"Native iOS/Android app — a PWA or hybrid app is accepted"*)

**API-first strategy for V2+**

V1 is designed with a **well-defined API decoupled from the frontend**. If the team decides to build a native mobile app in V2, it simply consumes the V1 API directly — no backend rewrite needed.

```
V1 : [Browser mobile/desktop]  ── HTTP ──>  [API REST]  ──>  [DB]
V2 : [Native iOS/Android app]  ── HTTP ──>  [Same API]  ──>  [Same DB]
```

### General architecture

- **Client-server** with REST API
- **Two interfaces** on the same deployment, separated by role: Employer / Employee
- **Database** supporting transactions
- **JWT auth**, Employer / Employee roles with strictly differentiated access

---

## MVP Features

### Employer Role

#### Account management
| Feature | Description | Priority |
|---------|-------------|----------|
| Signup & secure login | Employer signup with JWT auth | Must-have |
| Company profile | Name, SIRET, contact details | Must-have |
| Dashboard | Available token balance | Must-have |

#### Employee management
| Feature | Description | Priority |
|---------|-------------|----------|
| Employee account creation (by employer) | Employer creates the account and shares credentials | Must-have |
| Employee self-registration via invitation | Employee signs up via invitation link or company code | Must-have |
| Double validation | Email/SMS confirmation from both parties before activation | Must-have |
| Edit & deactivate | Modify or deactivate an employee account | Must-have |
| Employee list | View all employees with their token balance | Must-have |

#### Token management
| Feature | Description | Priority |
|---------|-------------|----------|
| Deposit → tokens | Convert a monetary amount into tokens (1€ = 1 token V1) | Must-have |
| Manual attribution | Assign tokens to one or more employees with a reason | Must-have |
| Full history | Date, amount, recipient for every attribution | Must-have |
| Real-time balance | Employer token balance updated instantly | Must-have |

### Employee Role

#### Personal dashboard
| Feature | Description | Priority |
|---------|-------------|----------|
| Secure login | Using credentials provided by the employer | Must-have |
| Real-time token balance | Updated immediately after each attribution | Must-have |
| Received tokens history | Date, amount, sender | Must-have |

#### Offers catalogue
| Feature | Description | Priority |
|---------|-------------|----------|
| Available offers list | Token cost displayed for each offer | Must-have |
| Offer detail | Partner brand, value, description | Must-have |
| Filters | By category and by required token amount | Must-have |

#### Token redemption
| Feature | Description | Priority |
|---------|-------------|----------|
| Select & confirm exchange | Validation flow before debit | Must-have |
| Balance check | Verify sufficient balance before confirming | Must-have |
| Debit + promo code display | Code displayed immediately after confirmation | Must-have |
| Redemption history | Log of all completed exchanges | Must-have |

## Technical Requirements

| Requirement | Detail |
|-------------|--------|
| **Architecture** | Client-server with REST API |
| **Database** | Relational PostgreSQL |
| **Authentication** | JWT — Employer / Employee role management |
| **Application** | Accessible from mobile and desktop browsers |
| **Hosting** | Test environment accessible online |
| **Performance** | Response time < 2 seconds for main actions |
| **Real-time** | Token balance updated in real time or near-real time after attribution |

### Database — Minimum expected entities

| Entity | Key fields |
|--------|------------|
| **Employer** | Company name, SIRET, email, password, token balance |
| **Employee** | First name, last name, username, password, token balance, employer link |
| **Token transaction** | Sender, recipient, amount, date, reason |
| **Partner offer** | Partner name, description, token cost, value in euros, category, status (active/inactive) |
| **Promotional code** | Code, linked offer, status (available/used), date used, beneficiary |
| **Exchange history** | Employee, offer, delivered code, date, tokens debited |

### Team Implementation Choices

| Choice | Detail |
|--------|--------|
| Auth | JWT (7-day expiry) + refresh token, bcrypt |
| Validation | Zod + sanitize-html on all endpoints |
| Rate limiting | 30 req / min / IP |

---
