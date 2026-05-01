# 🟢 Prim'O — *Your efforts rewarded instantly* ⚡

> **Real-time bonuses.** The employer rewards, the employee earns, the motivation is immediate.

---

## 📋 Table of Contents

- [About](#about)
- [Project Overview](#project-overview)
- [Team Formation](#team-formation)
- [Stakeholders](#stakeholders)
- [Decision — PWA vs React Native](#decision--pwa-vs-react-native)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Features (V1 Recalibrated)](#features-v1-recalibrated)
- [Development Phases](#development-phases)
- [Acceptance Tests](#acceptance-tests)
- [Getting Started](#getting-started)

---

## 🚀 About

**Prim'O** is a mobile and web application that allows employers to award tokens to their employees **at the exact moment of performance**, and to exchange those tokens for exclusive deals from major partner brands.

### The Problem

Traditional bonuses arrive with a one-month delay. They get lost in the paycheck, come after the effort, and no longer feel like a thank-you. In the meantime: motivation fades, recognition dilutes, and the connection between effort and reward is lost.

### The Solution

A **meritocratic reverse reward pool**: the company funds it, the employee earns, and motivation is immediate.

| Actor | Action |
|-------|--------|
| 🏢 Employer | Awards tokens at the moment of performance |
| 👤 Employee | Sees their earnings instantly |
| 🪙 Tokens | Exchanged for exclusive deals from partner brands |

### Key Mechanics (V1)

1. The employer creates a company account
2. They create employee accounts
3. They deposit money → converted into tokens
4. They manually assign tokens to collaborators
5. The employee sees their tokens in real time on their interface
6. They redeem tokens for partner promotional codes (delivered in one click)

---

## 📊 Project Overview

| | |
|---|---|
| **Project Name** | Prim'O |
| **Tagline** | Vos efforts récompensés instantanément ! |
| **Version** | V1 |
| **Status** | 🚧 In development |
| **Started** | 04/21/2026 |

---

## 👥 Team Formation

### Team Members

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Mario Colomas** | Project Manager Backend Developer | Coordination, planning, communication with client API, database, business logic |
| **Mateo Marques** | Fullstack Developer | Support front & back |
| **Lucas Nevaro** | Frontend Developer | Mobile UI development Wireframes, prototypes, user  |

### Team Norms

- **Communication tool:** Discord
- **Task management:** Jira
- **Code collaboration:** GitHub — branch naming: `feature/`, `fix/`, `chore/`
- **Meetings:** 2x per week
- **Decision-making:** Consensus

---

## 🎯 Stakeholders

| Stakeholder | Role | Impact on Project |
|-------------|------|-------------------|
| **Client (Prim'O) — Julien & Sandrine** | Founders / Product Owners | Define the vision, validate features, provide domain expertise |
| **Development Team** | Builds the application | Builds and delivers the entire product |
| **Partner Brands** | Distribution partners | Supply the promotional offers that give tokens their value |
| **Employers (B2B clients)** | Primary users (moderation side) | Core paying customers — their UX drives adoption |
| **Employees** | End users (mobile app) | Their engagement validates the product's motivational impact |

---

## ⚖️ Decision — PWA vs React Native

### Why PWA (Progressive Web App)?

**Recommended stack: NX Monorepo / Tailwind / React / Vite**

| Criterion | PWA ✅ | React Native ❌ |
|-----------|--------|----------------|
| **Deployment** | Instant — no store review | App Store (99$/yr, 1-2 week review) |
| **Dev time** | Faster, one codebase | Higher learning curve from scratch |
| **Team familiarity** | React — known by team | RN ecosystem = 2-3 weeks lost |
| **Offline support** | ✅ Service Workers | ✅ Native |
| **Installable on mobile** | ✅ Add to home screen | ✅ Native app |
| **Push notifications** | ✅ Via Web Push | ✅ Native |
| **Cost** | 🟢 Free to deploy | 🔴 99$/yr Apple Dev account |
| **Time to market** | 🟢 Fast | 🔴 Slow (store approval) |

**PWA (Progressive Web App):**
- Installable on iPhone & Android — no store required
- Works offline via Service Workers
- Accessible via browser on all devices
- ✅ Eliminates store approval delays
- ✅ Employer can use it directly via PC/PME

> ⚠️ **Note:** A PWA cannot access some native device features (Face ID, background Bluetooth). However, for Prim'O V1 these limitations are **not blocking**.

---

## 🏗️ Architecture

```
NX Monorepo (React + Vite + Tailwind)
├── apps/
│   ├── frontend/          # React PWA (employer + employee interfaces)
│   └── backend/           # Node.js / Express API
├── libs/
│   └── shared/            # Shared types, utils, constants
└── infra/
    └── docker-compose.yml
```

**Hosting:**
- Front → Vercel
- Back → Railway (or VPS)

---

## 🛠 Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Monorepo | NX |
| PWA | Vite PWA plugin |
| State | Zustand or Context API |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express |
| Auth | JWT (7 days) + refresh token |
| ORM | Prisma |

### Database
| Layer | Technology |
|-------|-----------|
| Primary DB | PostgreSQL |
| Storage | Supabase or Railway Postgres |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| CI/CD | GitHub Actions |

---

## 🗄️ Data Model

### Main Tables

**@USERS**
- `id`: uuid, name, email, token, role (Employer/Employee/Partner/Admin), company\_id, created\_at

**TOKENS\_TRANSACTIONS**
- `id`: uuid, from (FK [T]), action, type, token\_amount, created\_at

**OFFERS**
- `id`: uuid, company\_name, description, token\_cost, discount\_pct, promo\_code, available, created\_at, partner

**PROMO CODES (PRIMO Q4 points sensibles)**
- `id`: uuid, code, name, description, token\_cost, discount\_pct, promo\_code, available, created\_at, partner

**Logical relationships:**
- `@USERS` → uuid → company (Employer/Employee), token (balance)
- `TOKENS_TRANSACTIONS` → action, type, token\_amount
- `OFFERS` → company\_name, description, token\_cost, discount\_pct, promo\_code

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Employer signup | ❌ |
| POST | `/auth/login` | Login (all roles) | ❌ |
| POST | `/auth/refresh` | Refresh JWT | ✅ |
| POST | `/auth/logout` | Invalidate token | ✅ |

### Employer
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/employer/dashboard` | Dashboard stats | ✅ Employer |
| POST | `/employer/employees` | Create employee | ✅ Employer |
| GET | `/employer/employees` | List employees | ✅ Employer |
| POST | `/employer/tokens/deposit` | Deposit → tokens | ✅ Employer |
| POST | `/employer/tokens/assign` | Assign tokens | ✅ Employer |
| GET | `/employer/transactions` | Transaction history | ✅ Employer |

### Employee
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/employee/dashboard` | Personal dashboard | ✅ Employee |
| GET | `/employee/tokens` | Token balance | ✅ Employee |
| GET | `/employee/offers` | Offers catalogue | ✅ Employee |
| POST | `/employee/offers/redeem` | Redeem promo code | ✅ Employee |
| GET | `/employee/history` | Gains history | ✅ Employee |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/companies` | All companies | ✅ Admin |
| POST | `/admin/offers` | Create offer | ✅ Admin |
| DELETE | `/admin/offers/:id` | Delete offer | ✅ Admin |
| GET | `/admin/stats` | Global stats | ✅ Admin |

---

## 🔒 Security *(Critical Point — Client)*

### Authentication
- `bcrypt` salt rounds = 12
- Blacklisting: MapCache + Tanser + BlockedCredentials
- Multi-device: JWT linked to `company_id` + employee
- `X-Device-id` company id → JWT

### PRIMO Promo Code Handling
- One promo code per user / per offer
- Each redemption logged (user, offer, date)
- Limited stock: `available` field on offer
- Codes: Encrypted + hashed in DB (`.env`)

### General
- Helmet.js → HTTP security headers
- Rate limiter — 30 requests / minute / IP
- CORS: Whitelist allowed domains, block others
- Input validation: Zod + sanitize-html
- JWT: Secret stored in `.env` (never logged)

---

## ✨ Features (V1 Recalibrated)

### Employer Interface
- [ ] Company account + login
- [ ] Create / manage employee accounts
- [ ] Deposit money → token conversion
- [ ] Manual token attribution to collaborators
- [ ] Transaction history dashboard
- [ ] Real-time budget overview

### Employee Interface (Mobile PWA)
- [ ] Personal dashboard
- [ ] Real-time token balance display
- [ ] Gains history & tracking
- [ ] Partner offers catalogue
- [ ] Promo code redemption (1-click delivery)

### Admin Interface → V2
- [ ] BackOffice admin office → V2
- [ ] App native React Native → V2
- [ ] Échange inter-tokens → V2

### HOMO DEPLOY (PWA)
- [ ] Supabase DB (postgres) → pulling TJS
- [ ] Prisma ORM → schema migration
- [ ] Zod (REDIS) → same logic apply
- [ ] Web Push credit → notification de token
- [ ] Well-Front Push credit → ?

---

## 🏗️ Development Phases

### S1 — Setup (Week 1)
- Repo GitHub, ESLint / Prettier, NX Monorepo, Docker / Postgres Express / Prisma, auth JWT minimal, Vite + Tailwind

### S2 — Auth Complete
- Registration / Login with JWT
- Role management (employer/employee/admin)
- Protected routes frontend

### S3 — Token Logic *(Core Feature)*
- Deposit → token conversion
- Manual assignment employer → employee
- Transaction logging (immutable)

### S4 — Employee Interface
- Dashboard → token balance real-time
- Gains history display
- UX mobile-first

### S5 — Offers Catalogue & Redemption
- Offers listing
- Redemption logic → promo code delivery
- Stock management (available field)

### S6 — Deployment
- Vercel (front) + Railway (back)
- Environment variables configured
- PWA manifest + service worker

---

## ✅ Acceptance Tests

> To be signed off by **Julien & Sandrine**

**Question 1 — Token mechanics:**
- Employer creates account → 100 tokens → Employee A: +20, Employee B: +30
- Employee A balance = 20 ✅, Employee B = 30 ✅, Employer remaining = 50 ✅

**Question 2 — Partner merchants:**
- Samsung 100-token offer exists in catalogue
- Employee with 100 tokens clicks "Redeem" → promo code delivered ✅
- Employee with < 100 tokens → blocked ✅

**Question 3 — Legal status of tokens:**
- Tokens are classified as employee benefits (avantages salariés)
- No banking license required
- Tokens have no direct monetary exchange value for the employee

---

## ⚡ Getting Started

### Prerequisites

```bash
node >= 18.x
npm >= 9.x
docker (optional, for local postgres)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/[org]/primo.git
cd primo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# → Fill in your .env values

# Generate Prisma client & migrate DB
npx prisma migrate dev

# Run in development
npm run dev
```

### Environment Variables

```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/primo
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
```

---

## 🤝 Contributing

1. Create your branch: `git checkout -b feature/your-feature`
2. Commit: `git commit -m 'feat: add your feature'`
3. Push: `git push origin feature/your-feature`
4. Open a Pull Request → assign to Project Manager for review

### Commit Convention

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling / config |
| `refactor:` | Code change, no feature/fix |

---

---

<p align="center">
  <strong>On ne récompense plus demain ce qui s'est passé hier.</strong><br/>
  <em>Bienvenue dans le temps réel. — The Prim'O Team</em>
</p>
