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
