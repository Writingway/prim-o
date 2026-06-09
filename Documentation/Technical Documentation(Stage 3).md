# Prim'O - Technical Documentation (Stage 3)

![Prim'O Logo](img_doc/logo.png)

## Table of Contents

0. [User Stories and Mockups](#0-user-stories-and-mockups)
1. [Design System Architecture](#1-design-system-architecture)
2. [Components, Classes, and Database Design](#2-components-classes-and-database-design)
3. [High-Level Sequence Diagrams](#3-high-level-sequence-diagrams)
4. [External and Internal APIs](#4-external-and-internal-apis)
5. [SCM and QA Strategies](#5-scm-and-qa-strategies)
6. [Technical Justifications](#6-technical-justifications)

---

## 0. User Stories and Mockups

### 0.1 User Stories

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

### 0.2 Mockups (Main Screens)

![Mockups](img_doc/created-gif.gif)

We designed simple wireframes for the MVP that map routes to screens:

- `/login` - Login page: fields for email and password, "forgot password" link, and clear CTA to sign in.
- `/signup` - Signup page: registration form (name, email, password) and role selection or invitation code depending on flow.
- `/employer-dashboard` - Employer dashboard: shows current token balance, quick actions (deposit tokens, award tokens), employee list, and transaction history.
- `/employer/award-tokens` - Award tokens form: select employee, enter token amount and required reason, preview total, and confirm; includes server-side balance validation before submission.
- `/employee-dashboard` - Employee dashboard: displays token balance, recent receipts, and shortcuts to the offers catalogue and redemption history.
- `/employee/offers` - Offers catalog: searchable and filterable list of partner offers with token cost, brand, brief description, and "Redeem" button linking to the redemption flow.
- `/employee/redemption` - Redemption flow (receives offer via state): confirmation screen showing offer details and cost, final "Confirm" action that atomically debits tokens and returns the promo code immediately.


---

## 1. Design System Architecture

![Design System Architecture](img_doc/Design%20System%20Architecture.png)

The diagram below represents the client-server architecture of Prim'O, organized into four distinct layers.

### 1.1 Frontend - React

The frontend is a **mobile-first responsive web app** built with React. It exposes three interfaces depending on the role of the logged-in user:

- **Admin Dashboard** - internal interface reserved for the Prim'O team. Used to manage partner offers, import promo code stocks, and monitor the platform. Access is strictly restricted and never publicly exposed.
- **Employer Dashboard** - back-office interface allowing the employer to manage their employees, deposit tokens, and assign them manually.
- **Employee Web App** - mobile interface allowing the employee to check their token balance in real time, browse the partner offers catalogue, and redeem tokens for promo codes.

The frontend communicates with the backend over **HTTPS** and receives responses in **JSON** format.

### 1.2 Backend Server - Node.js + Express

The backend exposes a **REST API** that forms the core of the application. It is structured around three responsibilities:

- **Expose REST API endpoints** - the HTTP routes that receive requests from the frontend and route them to the appropriate logic.
- **Authentication & Authorization (JWT + bcrypt)** - every request is verified via a JWT token. Three roles are strictly isolated: Admin, Employer, and Employee. Each role has its own middleware and its own set of accessible routes. Passwords are hashed with bcrypt.
- **Apply business logic** - contains the core business logic of Prim'O:
  - **Token management**: crediting, debiting, and balance verification on every assignment or redemption.
  - **Promo code delivery**: checking available code stock and instantly assigning a code to the employee upon redemption.

### 1.3 Database Layer

The database layer consists of two components:

- **Prisma ORM** - a type-safe abstraction layer between the backend and the database. It translates JavaScript calls into SQL queries and ensures type consistency on both reads and writes.
- **PostgreSQL** - the relational database that stores all application data:
  - Admins, Employers & Employees (in separate tables)
  - Token transactions
  - Partner offers
  - Promotional codes and their status (available / used)

The backend sends its **SQL queries** through Prisma, which forwards them to PostgreSQL. **Results** travel back in the reverse order.

### 1.4 External Service - Stripe

Stripe is the external service used to handle **secure payments** made by the employer when depositing tokens.

- The employer initiates a payment from the dashboard.
- Stripe processes the transaction securely.
- A **webhook** is sent to the backend to confirm the payment server-side.
- Tokens are only credited to the employer's account after the webhook confirmation is received.

This mechanism ensures that no token can ever be credited without a validated payment.

---

## 2. Components, Classes, and Database Design

### 2.1 Frontend Components (React)

| Component / Page | Type | Purpose |
|------------------|------|---------|
| LoginPage | Page | User login with email and password (JWT-based) |
| SignupPage | Page | User registration (employer or employee role selection) |
| EmployerDashboard | Page | Main employer interface - token balance, employee list, quick actions |
| EmployeeDashboard | Page | Main employee interface - balance display, received tokens, shortcuts |
| AdminDashboard | Page | Protected admin area for managing offers, promo codes, monitoring platform |
| AwardTokensPage | Page | Form for employer to award tokens to selected employee with reason |
| OffersPage | Page | Searchable & filterable partner offers catalogue (employee view) |
| RedemptionPage | Page | Confirmation screen & promo code delivery on token redemption |
| EmployeeListCard | UI Component | Displays employee info (name, email, balance, status) with action buttons |
| TokenBalanceCard | UI Component | Shows current token balance with quick deposit/redeem buttons |
| OfferCard | UI Component | Shows offer (brand, token cost, value in euros, redeem button) |
| PromoCodeDisplay | UI Component | Shows redeemed promo code with copy to clipboard button |
| TransactionHistoryTable | UI Component | Lists all token transactions with date, amount, sender, reason |
| DepositModal | UI Component | Modal with Stripe payment form for token deposit |
| Header | UI Component | Logo, navigation, user menu, login state display |
| ProtectedRoute | Utility | Restricts routes based on JWT and user role (Admin/Employer/Employee) |
| FormInput | Utility | Reusable input field with validation feedback |
| ErrorAlert | Utility | Displays error/success messages to user |

**Interaction flow example:**
- Employer logs in → sees dashboard with balance → clicks "Award Tokens" → selects employee + amount + reason → confirms → tokens transferred atomically
- Employee logs in → sees balance → browses offers → clicks "Redeem" → confirms → receives promo code instantly

---

### 2.2 Backend Classes (Node.js + Express)

We organize backend logic into **Services** (business logic) and **Repositories** (database access). Here's a simple overview:

#### Backend Architecture Overview

| Component | Simple Meaning | What It Does (Job) | Database Table(s) Used |
|-----------|----------------|-------------------|------------------------|
| **Auth Service** | Login & security | Manages registration, login, JWT token generation/validation, password hashing | ADMIN, EMPLOYER, EMPLOYEE, REFRESH_TOKEN |
| **Employer Service** | Employer management | Creates employer accounts, manages employees, deposits tokens, awards tokens | EMPLOYER, EMPLOYEE, TOKEN_TRANSACTION |
| **Employee Service** | Employee management | Creates employee accounts, manages profile, views balance and history | EMPLOYEE, TOKEN_TRANSACTION |
| **Token Service** | Token operations | Credits/debits tokens, validates balances, ensures atomic transfers | TOKEN_TRANSACTION, EMPLOYER, EMPLOYEE |
| **Offer Service** | Offers management | Creates/updates partner offers, deactivates offers, retrieves active offers | PARTNER_OFFER |
| **Promo Code Service** | Code management | Assigns promo codes to employees, marks codes as used, tracks availability | PROMO_CODE, EXCHANGE_HISTORY |
| **Payment Service** | Stripe integration | Creates payment intents, handles webhooks, credits tokens after successful payment | EMPLOYER, TOKEN_TRANSACTION |
| **Validation Service** | Input safety | Validates all user input using Zod schemas, prevents invalid data entry | N/A |
| **Rate Limiter** | API protection | Limits requests to 30 per minute per IP address, prevents abuse | N/A (in-memory counter) |
| **Error Handler** | Error management | Centralizes error handling, logs errors, sends appropriate error responses | N/A |

**Component interactions:**
- Auth Service validates login credentials → Token Service confirms user identity → Employer/Employee Service loads dashboard data
- Employer awards tokens → Token Service debits employer + credits employee in atomic transaction → TransactionRepository logs the transfer
- Employee redeems tokens → Promo Code Service assigns available code → ExchangeHistoryRepository records the redemption

**In short:**
- **Auth** = Who you are
- **Employer/Employee** = Account management
- **Token** = Money movement (credit/debit)
- **Offer/PromoCode** = What you can buy (catalog & redemption)
- **Payment** = How you pay (Stripe integration)
- **Validation** = Keeping data safe and correct

---

### 2.3 Relational Database Schema (MVP)

Below is a cleaned, developer-friendly view of the MVP relational schema rendered in Mermaid, followed by a compact table explaining each table's purpose and key fields. The schema is intentionally minimal and will evolve with new features (e.g., delivery tracking).

![Relational Database](img_doc/Relationnal%20Database.png)

#### Database Tables

| Table | Purpose | Key Fields / Notes |
|-------|---------|-------------------|
| `ADMIN` | Platform administrators | `id`, `email` (unique), `passwordHash`, timestamps |
| `EMPLOYER` | Companies that deposit tokens and manage employees | `id`, `companyName`, `email`, `tokenBalance`, verification flags, timestamps |
| `EMPLOYEE` | Company employees who receive and spend tokens | `id`, `firstName`, `lastName`, `email`, `tokenBalance`, `employerId` (FK), invitation & verification tokens |
| `REFRESH_TOKEN` | Long-lived auth tokens per user/role | `id`, `tokenHash` (store hashed), `role`, `expiresAt`, `isRevoked`, FK to owner (admin/employer/employee) |
| `TOKEN_TRANSACTION` | Records of token movements | `id`, `amount`, `reason`, `senderId` (FK), `recipientId` (FK), `createdAt` |
| `PARTNER_OFFER` | Offers available for redemption | `id`, `partnerName`, `tokenCost`, `valueEuros`, `category`, `isActive` |
| `PROMO_CODE` | Individual promo codes for offers | `id`, `code` (unique), `offerId` (FK), `isUsed`, `usedAt` |
| `EXCHANGE_HISTORY` | Tracks which promo code was given for a redemption | `id`, `tokensDebited`, `employeeId` (FK), `promoCodeId` (FK), `createdAt` |

#### Design Notes

- Store `tokenBalance` on both `EMPLOYER` and `EMPLOYEE` for quick reads, but always update via atomic DB transactions to avoid inconsistencies.
- Promo codes are stored per `PARTNER_OFFER` and marked `isUsed` atomically during redemption to ensure a code is issued exactly once.
- Refresh tokens should be stored hashed (`tokenHash`) and include `replacedByTokenId` to support rotation and revocation.
- Timestamps and soft-delete (`deletedAt`) allow safe audits and easy recovery.

#### Summary

- **Employer/Employee** = accounts holding token balances
- **TokenTransaction** = transfer ledger (employer → employee, etc.)
- **PartnerOffer** = catalog items redeemable with tokens
- **PromoCode** = single-use code assigned on redemption
- **ExchangeHistory** = link between redemption, employee and code

---

## 3. High-Level Sequence Diagrams

### 3.1 Authentication Flow - JWT

![User Login (JWT)](img_doc/User%20Login%20(JWT).png)

#### Authentication Steps

1. Enter email + password - the user fills in their credentials on the login form and submits.
2. Send login request - the frontend sends the credentials to the backend via a secure HTTPS request.
3. Check user credentials - the backend queries the database through Prisma to find the matching account.
4. User found (hashed password + role) - the database returns the user row including the bcrypt-hashed password and their role.
5. `bcrypt.compare(password, hash)` - the backend compares the plain password against the stored hash to verify the identity without ever storing the password in clear text.
6. Return JWT token - if the credentials are valid, the backend signs and returns a JWT token containing the user's ID and role.
7. Store JWT - the frontend stores the token in an HttpOnly cookie, making it inaccessible to JavaScript and protected against XSS attacks.
8. User is logged in - the frontend redirects the user to the correct dashboard based on their role.

### 3.2 Employer Token Management

![Employer Token Management](img_doc/Employer%20Token%20Management.png)

#### View Token Balance

1. **Open dashboard** - the employer opens their back-office interface. This action triggers an automatic request to load the current state of their account.
2. **Request balance** - the frontend sends a request to the backend to retrieve the employer's current token balance.
3. **Fetch balance** - the backend queries the database to find the token balance linked to this employer's account.
4. **Return balance** - the database sends the value back to the backend.
5. **Display current balance** - the backend forwards the balance to the frontend, which displays it in real time on the employer's dashboard.

#### Assign Tokens to Employee

1. **Select employee + enter amount + reason** - the employer chooses an employee from their list, enters the number of tokens to assign, and provides a reason for the reward (e.g., "Exceeded monthly target").
2. **Send assignment request** - the frontend sends the assignment request to the backend with the employee ID, the amount, and the reason.
3. **Check employer balance >= amount** - before doing anything, the backend verifies that the employer's current token balance is greater than or equal to the amount being assigned. If not, the request is rejected.
4. **Debit employer + Credit employee** - in a single atomic database transaction, the backend deducts the tokens from the employer's balance and adds them to the employee's balance. Both operations happen at the same time - there is no state where tokens are debited but not credited, or vice versa.
5. **Transaction confirmed** - the database confirms that the transaction was saved successfully.
6. **Updated balance + confirmation** - the backend returns the new balance and a success confirmation, which the frontend displays immediately to the employer.

#### View Attribution History

1. **Open history tab** - the employer navigates to the history section of their dashboard.
2. **Request transaction history** - the frontend requests the full list of past token attributions from the backend.
3. **Fetch transactions** - the backend queries the database for all token transactions linked to this employer.
4. **Return transactions list** - the database returns the full list of transactions.
5. **Display history** - the frontend displays each attribution with its date, amount, recipient, and reason, giving the employer full visibility over every reward they have issued.

### 3.3 Employee Token Usage & Promo Code Redemption

![Employee Token Usage](img_doc/Employee%20Token%20Usage%20%26%20Promo%20Code.png)

#### View Balance & Received History

1. **Open dashboard** - the employee opens their mobile interface. The frontend immediately fetches their current token balance and transaction history.
2. **Request balance & history** - the frontend sends a single request to the backend to retrieve both the balance and the list of received tokens.
3. **Fetch balance & transactions** - the backend queries the database for the employee's token balance and all incoming transactions linked to their account.
4. **Return balance & history** - the database returns both sets of data to the backend.
5. **Display balance + received tokens** - the frontend shows the employee their current balance along with a history of every token they have received, including the date, amount, and the employer who sent it.

#### Browse Partner Offers Catalogue

1. **Open offers catalogue** - the employee navigates to the offers section to browse available rewards they can redeem their tokens for.
2. **Request offers list** - the frontend requests the list of available partner offers from the backend, potentially with filters applied (category, maximum token cost).
3. **Fetch active offers** - the backend queries the database for all offers with an active status, meaning they are currently available for redemption.
4. **Return offers** - the database returns the filtered list of active offers.
5. **Display offers** - the frontend displays each offer with the partner brand name, the token cost required to redeem it, and its real monetary value in euros.

#### Redeem Tokens for Promo Code

1. **Select offer + confirm redemption** - the employee selects an offer they want and confirms they want to proceed with the redemption. A confirmation step is shown before any tokens are debited.
2. **Send redemption request** - the frontend sends the redemption request to the backend with the selected offer ID.
3. **Check balance >= offer cost** - the backend verifies that the employee's current token balance is sufficient to cover the cost of the selected offer. If not, the request is rejected and no tokens are debited.
4. **Debit tokens + assign promo code** - in a single atomic transaction, the backend deducts the token cost from the employee's balance and marks one available promo code for this offer as used, linking it to this employee.
5. **Return promo code** - the database returns the assigned promo code to the backend.
6. **Display promo code + updated balance** - the frontend instantly displays the promo code to the employee along with their updated token balance. The code is available immediately with no delay.

### 3.4 Stripe Payment Flow

![Stripe Payment Flow](img_doc/Stripe%20Payment%20Flow.png)

#### Create Payment Intent

1. **Enter deposit amount** - the employer enters the amount of money they want to deposit into their token wallet (e.g., 200€ = 200 tokens in V1).
2. **Submit deposit request** - the frontend sends the deposit request to the backend with the amount.
3. **Create payment intent** - the backend calls the Stripe API to create a Payment Intent. This is a Stripe object that represents the intention to collect a payment. It contains the amount, the currency, and any metadata needed.
4. **Return client_secret** - Stripe returns a `client_secret`, which is a unique temporary key that identifies this specific payment session. It is never stored - it lives only in memory for this transaction.
5. **Send client_secret** - the backend forwards the `client_secret` to the frontend so it can initialise the Stripe payment form.

#### Employer Confirms Payment

1. **Stripe Elements renders secure payment form** - using the `client_secret`, the frontend initialises Stripe Elements, which renders a secure, PCI-compliant card input form directly in the browser. The card details never touch the backend - they go directly to Stripe.
2. **Enter card details + confirm** - the employer fills in their card information and clicks confirm.
3. **Confirm payment (Stripe Elements)** - Stripe processes the payment securely on their end, handling all card validation, 3D Secure authentication, and fraud detection.
4. **Result (succeeded / failed)** - Stripe returns a result to the frontend indicating whether the payment succeeded or failed. This result is informational only - the backend does not act on it directly.

#### Webhook Confirmation & Token Credit

1. **Webhook (payment_intent.succeeded)** - independently of the frontend result, Stripe sends an HTTP POST request (a webhook) directly to the backend to confirm the payment server-side. This is the authoritative confirmation - it cannot be faked or intercepted by the frontend.
2. **Verify webhook signature** - the backend verifies the webhook signature using the Stripe secret key. This ensures the request genuinely comes from Stripe and has not been tampered with. If the signature is invalid, the request is rejected immediately.
3. **Credit tokens to employer wallet** - only after the signature is verified does the backend credit the tokens to the employer's account in the database. This is the critical rule: tokens are never credited before this step.
4. **Balance updated** - the database confirms the balance has been updated successfully.
5. **Acknowledge webhook (200 OK)** - the backend responds to Stripe with a 200 OK to confirm the webhook was received and processed. If Stripe does not receive this, it will retry the webhook automatically.
6. **Tokens credited - dashboard updated** - the employer's dashboard reflects the new token balance, ready to be assigned to employees.

---

## 4. External and Internal APIs

## 4.1 External APIs Used

| API | Purpose | Why chosen |
|-----|---------|------------|
| **Stripe** | Handle subscription payments and token top-ups securely | PCI-DSS compliance offloaded to Stripe, webhook-based server-side confirmation |
| **Brevo (Optional)** | Send account verification emails at signup | Managed deliverability (SPF/DKIM/DMARC), GDPR-compliant European provider |

---

## 4.2 Internal API Endpoints (MVP)

### Authentication

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| `POST` | `/auth/register` | Register a new employer account | `{ "companyName": "string", "siret": "string", "email": "string", "password": "string" }` | `{ "employerId": "uuid", "token": "jwt_token" }` |
| `POST` | `/auth/login` | Log in user and get JWT (any role) | `{ "email": "string", "password": "string" }` | `{ "token": "jwt_token", "role": "employer\|employee\|admin" }` |
| `POST` | `/auth/logout` | Log out the current user | Header: `Authorization: Bearer <token>` | `{ "success": true }` |
| `GET` | `/auth/me` | Get logged-in user info | Header: `Authorization: Bearer <token>` | `{ "id": "uuid", "role": "string", "email": "string" }` |

### Employer Account

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| `GET` | `/employers/me` | Get current employer profile | JWT required | `{ "id": "uuid", "companyName": "string", "siret": "string", "email": "string" }` |
| `PATCH` | `/employers/me` | Update current employer profile | `{ "companyName": "string", "email": "string" }` | `{ "success": true, "employer": { ... } }` |
| `GET` | `/employers/me/balance` | Get current employer token balance | JWT required | `{ "balance": 250, "updatedAt": "ISO-date" }` |

### Employee Management

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| `POST` | `/employees` | Create a new employee account | `{ "firstName": "string", "lastName": "string", "username": "string", "password": "string" }` | `{ "id": "uuid", "firstName": "string", "balance": 0, "isActive": true }` |
| `GET` | `/employees/me` | Get current employee profile and balance | JWT required | `{ "id": "uuid", "firstName": "string", "balance": 45, "isActive": true }` |
| `GET` | `/employees` | List employees of the current employer | JWT required | `[ { "id": "uuid", "firstName": "string", "balance": 45, "isActive": true } ]` |
| `GET` | `/employees/:id` | Get one employee's details | Path param: `id` | `{ "id": "uuid", "firstName": "string", "lastName": "string", "balance": 45, "isActive": true }` |
| `PATCH` | `/employees/:id` | Update employee profile or status | `{ "firstName": "string", "isActive": false }` | `{ "success": true, "employee": { ... } }` |
| `DELETE` | `/employees/:id` | Deactivate employee (soft delete) | Path param: `id` | `{ "success": true, "id": "uuid", "isActive": false }` |

### Tokens & Payments

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| `POST` | `/payments/checkout-session` | Create a Stripe checkout session to buy tokens | `{ "amount": 500 }` | `{ "sessionId": "string", "checkoutUrl": "stripe_url" }` |
| `POST` | `/payments/webhook` | Receive payment confirmation from Stripe | Stripe webhook payload | `{ "received": true }` |
| `POST` | `/tokens/award` | Award tokens from employer to employee(s) | `{ "employeeIds": ["uuid"], "amount": 50, "reason": "string" }` | `{ "success": true, "transactions": [ ... ], "newBalance": 150 }` |
| `GET` | `/tokens/transactions` | List token transactions of the current user | Query: `?page=1&limit=20` | `{ "transactions": [ ... ], "total": 47 }` |

### Partner Offers

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| `GET` | `/offers` | List active partner offers | Query: `?category=string&maxTokens=100` | `[ { "id": "uuid", "partner": "string", "tokenCost": 50, "valueEuros": 50 } ]` |
| `GET` | `/offers/:id` | Get offer details | Path param: `id` | `{ "id": "uuid", "partner": "string", "description": "string", "tokenCost": 50, "codesAvailable": 47 }` |
| `POST` | `/offers` | Create a new partner offer (admin only) | `{ "partner": "string", "title": "string", "tokenCost": 50, "valueEuros": 50, "category": "string" }` | `{ "id": "uuid", "status": "active", "codesAvailable": 0 }` |
| `PATCH` | `/offers/:id` | Update an offer or change status (admin only) | `{ "tokenCost": 45, "status": "inactive" }` | `{ "success": true, "offer": { ... } }` |
| `POST` | `/offers/:id/codes` | Bulk-import promo codes for an offer (admin only) | `{ "codes": ["string"] }` | `{ "success": true, "imported": 3, "codesAvailable": 50 }` |

### Redemption

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| `POST` | `/redemptions` | Redeem tokens for a promo code | `{ "offerId": "uuid" }` | `{ "id": "uuid", "partner": "string", "tokensSpent": 50, "promoCode": "string", "newBalance": 400 }` |
| `GET` | `/redemptions` | List redemptions of the current employee | Query: `?page=1&limit=20` | `{ "redemptions": [ ... ], "total": 7 }` |
| `GET` | `/redemptions/:id` | Get one redemption with the promo code | Path param: `id` | `{ "id": "uuid", "partner": "string", "tokensSpent": 50, "promoCode": "string" }` |

---

## 5. SCM and QA Strategies
 
### 5.1 Source Control Management (SCM)
 
#### Branching Strategy
 
| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Feature branches** | One branch per feature, named `feature/<name>`, branched off `dev` | Isolated development |
| **Dev branch** | Integration branch for testing all features together | Pre-production validation |
| **Main branch** | Production-ready, updated only via PR from `dev` | Production deployments |
 
**Workflow:** `feature/*` → `dev` → `main`
 
#### Commit Message Convention
 
Conventional Commits format.
 
| Format | Example |
|--------|---------|
| `<type>(<scope>): <description>` | `feat(auth): add JWT login endpoint` |
| `<type>: <description>` | `fix: prevent negative token amounts` |
 
**Allowed types:** `feat`, `fix`, `update`, `chore`, `docs`, `refactor`, `test`.
 
#### PR Review & Merge Policy
 
- **Minimum reviews required:** 1 approval from another team member.
- **Branch protection rules:** no self-review, no direct push to `dev`/`main`, all changes via PR, CI must pass.
- **Automated checks:** linting, unit tests, integration tests.
---
 
### 5.2 Quality Assurance (QA) Strategy
 
#### Testing Levels
 
| Testing Type | Coverage | Tools |
|--------------|----------|-------|
| **Unit Tests** | Business logic functions | Vitest |
| **Integration Tests** | API endpoints with test DB | Vitest + Supertest |
| **API Tests** | Manual endpoint testing during development | Postman |
| **End-to-End Tests** | Critical user journeys | Playwright |
| **Performance Tests** | Manual checks on critical pages (< 2s response) | Browser DevTools |
 
#### Testing Standards
 
| Category | Requirement |
|----------|-------------|
| **Code Coverage Target** | 100% on business logic and API endpoints (excluding configuration, type definitions, trivial getters) |
| **Bug Severity Levels** | Critical (blocker) / Major (24h) / Minor (current sprint) / Cosmetic (backlog) |
| **Regression Testing** | Full test suite runs on every PR via GitHub Actions |
| **Security Testing** | Zod validation, Prisma parameterized queries, sanitize-html, JWT verification, Stripe webhook signature check |
 
#### Deployment Pipeline
 
```
Code Commit → Linting (ESLint) → Unit Tests (Vitest) → Integration Tests (Vitest + Supertest) → Build → Staging (dev) → E2E Tests (Playwright) → Production (main)
```
 
---

## 6. Technical Justifications

### 6.1 Technology Choices

#### Frontend - React

**Why React?**
- **Rationale:** Largest frontend ecosystem; component-based; skills transferable to React Native for V2.
- **Trade-offs:** Steeper learning curve; larger bundle than Vue.
- **Alternatives considered:** Vue (smaller ecosystem), Angular (too heavy for MVP).

#### Backend - Node.js + Express

**Why Node.js + Express?**
- **Rationale:** JavaScript on both ends; team already familiar; Express is the de-facto standard for REST APIs.
- **Trade-offs:** Single-threaded; minimal architectural opinions.
- **Alternatives considered:** Python/FastAPI (adds a second language), NestJS (overhead), Go (unfamiliar).

#### Database - PostgreSQL + Prisma ORM

**Why PostgreSQL?**
- **Rationale:** Relational + ACID; mandatory for token transactions; 40+ years of production track record.
- **Trade-offs:** Requires upfront schema design.
- **Alternatives considered:** MongoDB (weaker transactions, past data-loss issues), MySQL (fewer advanced features), SQLite (not multi-user).

**Why Prisma ORM?**
- **Rationale:** Type-safe with TypeScript; first-class PostgreSQL support; simpler than legacy ORMs; built-in migrations.
- **Trade-offs:** Abstraction layer (raw SQL needed for some complex queries).
- **Alternatives considered:** Sequelize (older, more boilerplate), TypeORM (heavier API), raw SQL (no type safety).

#### Authentication - JWT + bcrypt

**Why JWT + bcrypt?**
- **Rationale:** Industry standard for REST APIs; team familiar; bcrypt is the long-established password hashing standard.
- **Trade-offs:** JWTs hard to revoke; bcrypt intentionally slow on login.
- **Alternatives considered:** Session + Redis (extra infrastructure), OAuth (overkill), Argon2 (less supported in Node).

#### Payment Gateway - Stripe

**Why Stripe?**
- **Rationale:** PCI-DSS offloaded; webhook server-side confirmation; best developer experience; widely adopted with mature Node.js SDK.
- **Trade-offs:** Transaction fees (~1.4% + 0.25€ EU); vendor lock-in.
- **Alternatives considered:** PayPal (worse DX), Adyen (overkill), Mollie (smaller ecosystem).

---

### 6.2 Architectural Decisions

#### Mobile-First, No Native App

**Why web app instead of native iOS/Android?**
- **Rationale:** Single codebase for mobile + desktop; no app store process; faster MVP delivery.
- **Trade-offs:** No native device features (push, biometrics, full offline).
- **Future consideration:** API designed as a clean REST contract — React Native can consume it directly in V2.

#### Atomic Transactions for Token Transfers

**Why atomic transactions?**
- **Rationale:** Token operations involve multiple writes (debit + credit + transaction record). A partial failure would corrupt balances.
- **Implementation:** All multi-step operations wrapped in PostgreSQL transactions via Prisma `$transaction`. Row-level locks (`SELECT ... FOR UPDATE`) on critical rows (e.g., last promo code).

#### Webhook-Driven Payment Confirmation

**Why webhooks for Stripe confirmation?**
- **Rationale:** The client cannot be trusted to confirm payments. Stripe webhooks provide tamper-proof server-side confirmation.
- **Security benefits:** Cryptographically signed payload verified server-side; tokens credited only after verification.

---

### 6.3 Security & Compliance Justifications

#### HttpOnly Cookies for JWT Storage

**Why HttpOnly cookies?**
- **Rationale:** JWT inaccessible to JavaScript; cookie automatically attached to outgoing requests.
- **Protection against:** XSS (no `document.cookie` access). Combined with `Secure` + `SameSite=Strict`, also mitigates CSRF.

#### Server-Side Balance Validation

**Why validate on the backend, not frontend?**
- **Rationale:** Frontend is controlled by the user; any client-side check is cosmetic and provides zero security.
- **Attack prevention:** Token amounts, prices, and balances are always re-fetched server-side. Client input limited to identifiers, never to values affecting business state.

#### Stripe Webhook Signature Verification

**Why verify webhook signatures?**
- **Rationale:** Webhook endpoint is publicly accessible; without verification, anyone could send fake events to credit tokens.
- **Attack prevention:** Stripe signs every payload with a shared secret; the Stripe SDK rejects any request with an invalid or missing signature before business logic runs.

---
