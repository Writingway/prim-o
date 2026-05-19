## Prim'O Logo


## Table of Content


## 3) User Stories and Mockups

### 3.1 User Stories

#### Must Have (essential for MVP)

**Employer:**
- As an employer, I want to register and log in securely, so I can access my account
- As an employer, I want to create employee accounts, so my team can use the platform
- As an employer, I want to deposit funds and convert them to tokens, so I can reward employees
- As an employer, I want to manually award tokens to employees, so I can recognize performance instantly
- As an employer, I want to view my employee list and their token balances, so I can manage rewards
- As an employer, I want to see transaction history, so I can track all token distributions

**Employee:**
- As an employee, I want to log in securely, so I can access my account
- As an employee, I want to view my token balance in real-time, so I know what I've earned
- As an employee, I want to see all available offers with token costs, so I can choose what to redeem
- As an employee, I want to redeem tokens for a promo code, so I can use the discount
- As an employee, I want to see my redemption history, so I know what I've exchanged
- As an employee, I want to receive and copy my promo code instantly, so I can use it right away

#### Should Have (important, but not critical for MVP)

- As an employer, I want to filter employees by status (active/inactive), so I can manage my team
- As an employee, I want to search and filter offers by category, so I can find what interests me
- As an employee, I want to receive notifications when tokens are awarded, so I'm always updated
- As an employer, I want to export transaction reports, so I can analyze spending

#### Could Have (nice to have, future)

- As an employee, I want to save favorite offers, so I can redeem them faster
- As an employee, I want to receive email confirmation when redeeming, so I have a record
- As an employer, I want to see sales statistics, so I can analyze business performance

#### Won't Have (excluded for MVP)

- Real-time delivery tracking (too complex for V1)
- Loyalty points or discount systems (future feature)
- Native iOS/Android app (web app + PWA instead)

---

### 3.2 Mockups (Main Screens) ( A REFAIRE AU PROPRE SUR FIGMA )

#### Employer Interface

**LOGIN PAGE**
```
┌─────────────────────────────────┐
│         Employer Login          │
├─────────────────────────────────┤
│ Email      [________________]   │
│ Password   [________________]   │
│                                 │
│          [LOGIN]                │
│     New account? SIGN UP        │
└─────────────────────────────────┘
```

**SIGNUP PAGE**
```
┌─────────────────────────────────┐
│      Create Your Account        │
├─────────────────────────────────┤
│ Company Name  [________________]│
│ SIRET         [________________]│
│ Email         [________________]│
│ Password      [________________]│
│                                 │
│         [CREATE ACCOUNT]        │
└─────────────────────────────────┘
```

**EMPLOYER DASHBOARD**
```
┌──────────────────────────────────────────────────────┐
│ Prim'O Dashboard                  [Hello, Mario ▼]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────┐                     │
│  │ Your Token Balance          │                     │
│  │       250 TOKENS            │                     │
│  │  [+ Deposit] [Award Tokens] │                     │
│  └─────────────────────────────┘                     │
│                                                      │
│  Employees (12)              [+ Add Employee]        │
│  ┌────────────────────────────────────────────────┐  │
│  │ Name    │ Email          │ Balance │ Actions   │  │
│  ├────────────────────────────────────────────────┤  │
│  │ John    │ john@co.com    │ 45      │ Edit ⋮    │  │
│  │ Jane    │ jane@co.com    │ 120     │ Edit ⋮    │  │
│  │ Bob     │ bob@co.com     │ 0       │ Edit ⋮    │  │
│  └────────────────────────────────────────────────┘  │ 
└──────────────────────────────────────────────────────┘
```

**AWARD TOKENS FORM**
```
┌──────────────────────────────────┐
│ Distribute Tokens                │
├──────────────────────────────────┤
│ Select Employee(s)               │
│ [John Doe, Jane Smith]           │
│                                  │
│ Amount per employee              │
│ [50] tokens                      │
│                                  │
│ Reason (optional)                │
│ [Good work on project]           │
│                                  │
│ Review:                          │
│ Total: 100 tokens                │
│ Your balance: 250 → 150          │
│                                  │
│      [CONFIRM]   [CANCEL]        │
└──────────────────────────────────┘
```
---

**EMPLOYEE DASHBOARD (Web Mobile)**
```
┌─────────────────────────────┐
│ Prim'O       [Hello, John! ▼]
├─────────────────────────────┤
│                             │
│ ┌───────────────────────┐   │
│ │ Your Token Balance    │   │
│ │                       │   │
│ │     450 TOKENS        │   │
│ │                       │   │
│ │ [BROWSE OFFERS] [USE] │   │
│ └───────────────────────┘   │
│                             │
│ Recent Awards               │
├─────────────────────────────┤
│ +100 tokens                 │
│ from Mario                  │
│ Good work on project        │
│ May 18, 10:30 AM            │
├─────────────────────────────┤
│ +50 tokens                  │
│ from Julien                 │
│ May 15, 2:15 PM             │
├─────────────────────────────┤
│      [SHOW MORE]            │
└─────────────────────────────┘
```

**OFFERS CATALOG**
```
┌────────────────────────────┐
│ Available Offers    [🔍]  │
├────────────────────────────┤
│ Filters:                   │
│ Category: [All ▼]          │
│ Price: [20-500] €          │
├────────────────────────────┤
│ ┌──────────────────────┐   │
│ │ [Amazon Logo]        │   │
│ │ Amazon Gift Card     │   │
│ │ 100€ = 100 tokens    │   │
│ │    [REDEEM]          │   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ [Fnac Logo]          │   │
│ │ Fnac 50€ Card        │   │
│ │ 50€ = 50 tokens      │   │
│ │    [REDEEM]          │   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ [Netflix Logo]       │   │
│ │ Netflix 1-Month      │   │
│ │ 15€ = 15 tokens      │   │
│ │    [REDEEM]          │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

**REDEMPTION FLOW**
```
CONFIRMATION:
┌────────────────────────┐
│ Confirm Exchange       │
├────────────────────────┤
│ You will spend:        │
│ 100 tokens             │
│                        │
│ Your balance:          │
│ 450 → 350 tokens       │
│                        │
│  [CONFIRM] [CANCEL]    │
└────────────────────────┘

SUCCESS - CODE RECEIVED:
┌────────────────────────┐
│ ✓ Redeemed!            │
├────────────────────────┤
│ Your promo code:       │
│                        │
│ AMAZ-45K9-XL2M2  [📋] │
│                        │
│ 1. Copy code           │
│ 2. Go to Amazon.fr     │
│ 3. Enter at checkout   │
│                        │
│    [CLOSE]             │
└────────────────────────┘
```
# Technical Architecture — Prim'O

![Design System Architecture](img_doc/Design%20System%20Architecture.png)

The diagram below represents the client-server architecture of Prim'O, organized into four distinct layers.

---

## Frontend — React

The frontend is a **mobile-first responsive web app** built with React. It exposes three interfaces depending on the role of the logged-in user:

- **Admin Dashboard** — internal interface reserved for the Prim'O team. Used to manage partner offers, import promo code stocks, and monitor the platform. Access is strictly restricted and never publicly exposed.
- **Employer Dashboard** — back-office interface allowing the employer to manage their employees, deposit tokens, and assign them manually.
- **Employee Web App** — mobile interface allowing the employee to check their token balance in real time, browse the partner offers catalogue, and redeem tokens for promo codes.

The frontend communicates with the backend over **HTTPS** and receives responses in **JSON** format.

---

## Backend Server — Node.js + Express

The backend exposes a **REST API** that forms the core of the application. It is structured around three responsibilities:

- **Expose REST API endpoints** — the HTTP routes that receive requests from the frontend and route them to the appropriate logic.
- **Authentication & Authorization (JWT + bcrypt)** — every request is verified via a JWT token. Three roles are strictly isolated: Admin, Employer, and Employee. Each role has its own middleware and its own set of accessible routes. Passwords are hashed with bcrypt.
- **Apply business logic** — contains the core business logic of Prim'O:
  - **Token management**: crediting, debiting, and balance verification on every assignment or redemption.
  - **Promo code delivery**: checking available code stock and instantly assigning a code to the employee upon redemption.

---

## Database

The database layer consists of two components:

- **Prisma ORM** — a type-safe abstraction layer between the backend and the database. It translates JavaScript calls into SQL queries and ensures type consistency on both reads and writes.
- **PostgreSQL** — the relational database that stores all application data:
  - Admins, Employers & Employees (in separate tables)
  - Token transactions
  - Partner offers
  - Promotional codes and their status (available / used)

The backend sends its **SQL queries** through Prisma, which forwards them to PostgreSQL. **Results** travel back in the reverse order.

---

## External Service — Stripe

Stripe is the external service used to handle **secure payments** made by the employer when depositing tokens.

- The employer initiates a payment from the dashboard.
- Stripe processes the transaction securely.
- A **webhook** is sent to the backend to confirm the payment server-side.
- Tokens are only credited to the employer's account after the webhook confirmation is received.

This mechanism ensures that no token can ever be credited without a validated payment.

---

## User Login — JWT Authentication

![User Login (JWT)](img_doc/User%20Login%20(JWT).png)

1. Enter email + password — the user fills in their credentials on the login form and submits.
2. Send login request — the frontend sends the credentials to the backend via a secure HTTPS request.
3. Check user credentials — the backend queries the database through Prisma to find the matching account.
4. User found (hashed password + role) — the database returns the user row including the bcrypt-hashed password and their role.
5. bcrypt.compare(password, hash) — the backend compares the plain password against the stored hash to verify the identity without ever storing the password in clear text.
6. Return JWT token — if the credentials are valid, the backend signs and returns a JWT token containing the user's ID and role.
7. Store JWT — the frontend stores the token in an HttpOnly cookie, making it inaccessible to JavaScript and protected against XSS attacks.
8. User is logged in — the frontend redirects the user to the correct dashboard based on their role.