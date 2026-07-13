# Prim'O

> B2B2C instant reward platform: Your efforts, instantly rewarded!

Prim'O lets companies reward their employees through a token system that can be
redeemed for partner offers. Employers buy tokens, distribute them to their
employees based on configurable motives, and employees exchange them for promo
codes from partner brands.

**Stack:** React 19 · TypeScript · Express 5 / Node.js · PostgreSQL 16 · Prisma · JWT · Stripe · Tailwind CSS

---

## Table of Contents

- [Application Architecture](#application-architecture)
- [Database Diagram](#database-diagram)
- [Key Business Flows](#key-business-flows)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Tests](#tests)
- [Project Structure](#project-structure)

---

## Application Architecture

The application follows a decoupled client/server architecture: a React frontend
(SPA) consuming an Express REST API, backed by a PostgreSQL database through the
Prisma ORM. Payments are handled by Stripe and authentication relies on JWTs
(access + refresh tokens).

**Main layers:**

- **Frontend (`/frontend`)**: React 19 + TypeScript SPA, routing with TanStack
  Router, styling with Tailwind CSS, built with Vite. Communicates with the API
  through authenticated REST calls (JWT).
- **Backend (`/backend`)**: Express 5 REST API in TypeScript, structured in
  layers (routes -> controllers -> services), input validation with Zod,
  security via Helmet, CORS, rate limiting and HTML sanitization.
- **Database**: PostgreSQL 16, accessed exclusively through Prisma (typed
  schema, versioned migrations).
- **Payments**: Stripe integration for company token purchases, confirmed
  server-side through a signed, idempotent webhook.
- **Background jobs**: scheduled tasks for refresh-token cleanup and GDPR
  anonymization of inactive accounts.

**Authentication model**: short-lived JWT access token (kept in memory on the
client) paired with a rotating refresh token stored in an httpOnly cookie and
hashed in the database, enabling revocation and reuse-based theft detection.

---

## Database Diagram

The relational model is managed by Prisma (`backend/prisma/schema.prisma`) and
deployed on PostgreSQL. It covers companies, users (multiple roles), token
management, motive-based attributions, partner offers and promo codes.

---

## Key Business Flows

Diagrams of the main user journeys are available in `Documentation/img_doc/`:

- **Authentication (JWT)**: `User Login (JWT).png`
- **Employer token management**: `Employer Token Management.png`
- **Employee token usage and promo codes**: `Employee Token Usage & Promo Code.png`
- **Stripe payment flow**: `Stripe Payment Flow.png`

---

## Requirements

- Node.js >= 20
- npm >= 10
- PostgreSQL >= 15 (local or via Docker)
- Docker and Docker Compose (recommended for the database)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Writingway/prim-o.git
cd prim-o
```

### 2. Database (Docker)

```bash
# Starts PostgreSQL (port 5432) + Adminer (port 8080)
docker compose up -d
```

### 3. Backend

```bash
cd backend
npm install

# Copy and fill in the environment variables
cp .env.example .env
# -> Edit .env: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, BREVO_API_KEY, etc.

# Generate the Prisma client + apply migrations
npx prisma generate
npx prisma migrate dev

# (Optional) Seed the database with test data
npx prisma db seed
```

### 4. Frontend

```bash
cd ../frontend
npm install
```

---

## Running the App

### Backend (API on <http://localhost:4000>)

```bash
cd backend
npm run dev
```

### Frontend (application on <http://localhost:5173>)

```bash
cd frontend
npm run dev
```

Adminer (database UI) is available on <http://localhost:8080> once Docker is up.

---

## Tests

```bash
# Backend: unit tests
cd backend
npm test

# Backend: integration tests
npm run test:int

# Frontend: tests
cd ../frontend
npm test
```

---

## Project Structure

```
prim-o/
├── backend/                  # Express 5 + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Data model (entities, relations, enums)
│   │   ├── migrations/       # Versioned SQL migration history
│   │   └── seed.ts           # Initial data (categories, motives)
│   └── src/
│       ├── config.ts         # Environment validation (Zod, fail-fast)
│       ├── app.ts            # Express app assembly (middlewares + routes)
│       ├── server.ts         # Entry point: HTTP listen + background jobs
│       ├── routes/           # Endpoint definitions (routing only)
│       ├── controllers/      # HTTP layer: validation, authorization, response
│       ├── services/         # Business logic + DB access (Prisma)
│       ├── schemas/          # Input contracts (Zod validation)
│       ├── middleware/       # Authentication, authorization, error handling
│       ├── jobs/             # Background tasks (token cleanup, GDPR)
│       ├── lib/              # Reusable tools (db, token, mail, stripe, upload…)
│       └── types/            # Shared TypeScript declarations
├── frontend/                 # React 19 + TypeScript SPA (Vite)
│   └── src/
│       ├── main.tsx          # Entry point (mounts React)
│       ├── App.tsx           # Root component
│       ├── router.tsx        # Routes + navigation guards (TanStack Router)
│       ├── pages/            # One screen per page (dashboards, auth, admin…)
│       ├── components/       # Reusable components, grouped by domain
│       ├── services/api/     # Transport layer to the backend (client, auth, identity…)
│       ├── hooks/            # Reusable logic (useStats, useEmployeeDashboard…)
│       ├── lib/              # Pure helpers (format, avatars, image cropping)
│       └── types/            # Shared types
├── Documentation/            # Project documentation and diagrams
│   └── img_doc/              # Diagrams (architecture, DB, flows)
└── docker-compose.yml        # PostgreSQL + Adminer
```

---

## Team

Built as part of the Holberton School Portfolio Project by:

- **Mario Colomas**: Project Manager · Backend
- **Lucas Nevano**: Frontend · Source Control
- **Mateo Marques**: Fullstack · QA

Repository: <https://github.com/Writingway/prim-o>
