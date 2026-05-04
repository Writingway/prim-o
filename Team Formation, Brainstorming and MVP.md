# Prim'O — *Your efforts rewarded instantly*

> **Real-time bonuses.** The employer rewards, the employee earns, the motivation is immediate.

---

## Table of Contents

- [About](#about)
- [Project Overview](#project-overview)
- [Team Formation](#team-formation)
- [Stackholders](#stackholders)
- [MVP Features](#mvp-features)
- [Post-MVP Roadmap](#post-mvp-roadmap)

---

## About

**Prim'O** is a React Native mobile application that allows employers to award tokens to their employees **at the exact moment of performance**, and to exchange those tokens for exclusive deals from major partner brands.

### The Problem

Traditional bonuses arrive with a one-month delay. They get lost in the paycheck, come after the effort, and no longer feel like a thank-you. In the meantime: motivation fades, recognition dilutes, and the connection between effort and reward is lost.

### The Solution

A **meritocratic reverse reward pool**: the company funds it, the employee earns, and motivation is immediate.

| Actor | Action |
|-------|--------|
| Employer | Awards tokens at the moment of performance |
| Employee | Sees their earnings instantly |
| Tokens | Exchanged for exclusive deals from partner brands |

### Key Mechanics (V1)

1. The employer creates a company account
2. They create employee accounts
3. They deposit money → converted into tokens
4. They manually assign tokens to collaborators
5. The employee sees their tokens in real time on their interface
6. They redeem tokens for partner promotional codes (delivered in one click)

---

## Project Overview

| | |
|---|---|
| **Project Name** | Prim'O |
| **Tagline** | Vos efforts récompensés instantanément ! |
| **Version** | V1 |
| **Status** | In development |
| **Started** | 04/21/2026 |

---

## Team Formation

### Team Members

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Mario Colomas** | Project Manager Backend Developer | Coordination, planning, communication with client API, database, business logic |
| **Mateo Marques** | Fullstack Developer | Support front & back |
| **Lucas Nevano** | Frontend Developer | Mobile UI development Wireframes, prototypes, user  |

### Team Norms

- **Communication tool:** Discord
- **Task management:** Jira
- **Code collaboration:** GitHub — branch naming: `feature/`, `fix/`, `chore/`
- **Meetings:** 2x per week
- **Decision-making:** Consensus

---

## Stackholders

| Stackholder | Role | Impact on Project |
|-------------|------|-------------------|
| **Client (Prim'O) — Julien & Sandrine** | Founders / Product Owners | Define the vision, validate features, provide domain expertise |
| **Development Team** | Builds the application | Builds and delivers the entire product |
| **Partner Brands** | Distribution partners | Supply the promotional offers that give tokens their value |
| **Employers (B2B clients)** | Primary users (moderation side) | Core paying customers — their UX drives adoption |
| **Employees** | End users (mobile app) | Their engagement validates the product's motivational impact |

---

## MVP Features

### Employer Interface

| Feature | Description | Priority |
|---------|-------------|----------|
| Company account creation & login | Employer signup with JWT auth | Must-have |
| Employee account management | Create, list, and manage employee profiles | Must-have |
| Token deposit | Convert a monetary amount into a token balance | Must-have |
| Manual token attribution | Assign tokens to a specific employee with a note | Must-have |
| Transaction history | View all past deposits and attributions | Must-have |
| Real-time budget overview | See remaining token balance at a glance | Must-have |

### Employee Interface

| Feature | Description | Priority |
|---------|-------------|----------|
| Personal dashboard | Landing page showing current token balance | Must-have |
| Real-time token balance | Balance updates immediately after attribution | Must-have |
| Gains history | Chronological log of tokens received and reasons | Must-have |
| Partner offers catalogue | Browse available promotional offers and their token cost | Must-have |
| Promo code redemption | Redeem tokens for a promo code delivered in one click | Must-have |

### Technical Requirements

| Requirement | Detail |
|-------------|--------|
| Authentication | JWT (7-day expiry) + refresh token, bcrypt salt=12 |
| Promo code security | One code per user per offer, stock managed via `available` field |
| Rate limiting | 30 requests / minute / IP |
| Input validation | Zod + sanitize-html on all endpoints |
| Mobile | React Native — native iOS & Android app from day one |

---

## Post-MVP Roadmap

### V2 — Admin & Native App

| Feature | Description |
|---------|-------------|
| Admin back-office | Full dashboard to manage companies, offers, and global stats |
| React Native app | Already in V1 — no migration needed |
| Inter-token exchange | Allow employees to transfer tokens between each other |

### V3 — Automation & Analytics

| Feature | Description |
|---------|-------------|
| Rule-based attribution | Automatic token awards triggered by predefined performance criteria |
| Performance analytics | Employer dashboard with engagement and motivation metrics |
| Push notifications | Web Push alerts when tokens are received |
| Multi-company admin | Single admin account managing multiple employer entities |

### Partner Ecosystem

| Feature | Description |
|---------|-------------|
| Partner self-service portal | Brands manage their own offers and promo code stock |
| Offer targeting | Segment offers by company, role, or token tier |
| Co-branding | Employer-branded offer pages for premium accounts |

---
