# Prim'O — Sprint Plan (Stage 4)

> Sprints d'1 semaine · Équipe : Mario (PM/Backend), Mateo (Fullstack), Lucas (Frontend/UX)  
> Démarré le : 21/04/2026

---

## Prioritisation MoSCoW

| Priorité | Description |
|---|---|
| 🔴 Must Have | Bloquant — sans ça, le produit ne fonctionne pas |
| 🟠 Should Have | Important mais non bloquant pour le MVP |
| 🟡 Could Have | Utile, à faire si le temps le permet |
| ⚫ Won't Have (V1) | Hors scope pour cette version |

---

## Sprint 1 — Fondations & Auth
**Dates :** Semaine 1  
**Objectif :** Projet bootstrappé, DB opérationnelle, authentification fonctionnelle

### Backlog Sprint 1

| # | Tâche | MoSCoW | Assigné | Dépendance | Statut |
|---|---|---|---|---|---|
| S1-1 | Setup projet (monorepo, folders, Git, CI base) | 🔴 Must | Tous | — | ⬜ |
| S1-2 | Schéma Prisma — entités User, Employer, Employee, Token, Offer, Code | 🔴 Must | Mario | S1-1 | ⬜ |
| S1-3 | Migration DB + seed de dev | 🔴 Must | Mario | S1-2 | ⬜ |
| S1-4 | API Auth — register Employer (POST /auth/register) | 🔴 Must | Mario | S1-3 | ⬜ |
| S1-5 | API Auth — login + JWT + refresh token | 🔴 Must | Mario | S1-4 | ⬜ |
| S1-6 | Middleware auth (JWT verify + rate limit 30 req/min) | 🔴 Must | Mario | S1-5 | ⬜ |
| S1-7 | Page Login / Register — UI Employeur | 🔴 Must | Lucas | S1-1 | ⬜ |
| S1-8 | Intégration Auth frontend ↔ backend | 🔴 Must | Mateo | S1-5, S1-7 | ⬜ |
| S1-9 | Validation Zod sur tous les endpoints auth | 🔴 Must | Mario | S1-5 | ⬜ |

**Livrable :** Un employeur peut se créer un compte et se connecter.

---

## Sprint 2 — Gestion Employés & Attribution Tokens
**Dates :** Semaine 2  
**Objectif :** L'employeur peut ajouter des employés et leur attribuer des tokens

### Backlog Sprint 2

| # | Tâche | MoSCoW | Assigné | Dépendance | Statut |
|---|---|---|---|---|---|
| S2-1 | API — Créer un employé (POST /employees) | 🔴 Must | Mario | S1-3 | ⬜ |
| S2-2 | Double validation compte employé (email + SMS) | 🔴 Must | Mario | S2-1 | ⬜ |
| S2-3 | API — Lister les employés de l'employeur | 🔴 Must | Mario | S2-1 | ⬜ |
| S2-4 | API — Attribuer des tokens à un employé (POST /tokens/assign) | 🔴 Must | Mario | S2-1 | ⬜ |
| S2-5 | Règle : solde token jamais négatif + raison obligatoire | 🔴 Must | Mario | S2-4 | ⬜ |
| S2-6 | Dashboard Employeur — liste des employés | 🔴 Must | Lucas | S2-3 | ⬜ |
| S2-7 | UI — Formulaire d'attribution de tokens | 🔴 Must | Lucas | S2-4 | ⬜ |
| S2-8 | Intégration gestion employés frontend ↔ backend | 🔴 Must | Mateo | S2-3, S2-6 | ⬜ |
| S2-9 | Intégration attribution tokens frontend ↔ backend | 🔴 Must | Mateo | S2-4, S2-7 | ⬜ |
| S2-10 | Historique des attributions (GET /tokens/history) | 🟠 Should | Mario | S2-4 | ⬜ |
| S2-11 | Isolation employeur — guard cross-company | 🔴 Must | Mario | S2-1 | ⬜ |

**Livrable :** L'employeur peut créer des employés et leur donner des tokens.

---

## Sprint 3 — Offres Partenaires & Échange Tokens
**Dates :** Semaine 3  
**Objectif :** L'employé peut consulter ses tokens et les échanger contre des codes promo

### Backlog Sprint 3

| # | Tâche | MoSCoW | Assigné | Dépendance | Statut |
|---|---|---|---|---|---|
| S3-1 | API — CRUD Offres partenaires (admin/employer) | 🔴 Must | Mario | S1-3 | ⬜ |
| S3-2 | API — Lister les offres disponibles (GET /offers) | 🔴 Must | Mario | S3-1 | ⬜ |
| S3-3 | API — Échanger tokens contre code promo (POST /redeem) — atomique | 🔴 Must | Mario | S3-1 | ⬜ |
| S3-4 | Règle : code promo délivré exactement une fois | 🔴 Must | Mario | S3-3 | ⬜ |
| S3-5 | Interface Employé — dashboard mobile-first (solde tokens) | 🔴 Must | Lucas | S2-4 | ⬜ |
| S3-6 | Interface Employé — catalogue des offres | 🔴 Must | Lucas | S3-2 | ⬜ |
| S3-7 | Interface Employé — échange et affichage code promo | 🔴 Must | Lucas | S3-3 | ⬜ |
| S3-8 | Intégration offres + échange frontend ↔ backend | 🔴 Must | Mateo | S3-2, S3-3, S3-6 | ⬜ |
| S3-9 | Notifications (email) lors de l'attribution et de l'échange | 🟠 Should | Mario | S2-4, S3-3 | ⬜ |
| S3-10 | UI responsive polish — mobile iOS/Android tests | 🟠 Should | Lucas | S3-5 | ⬜ |
| S3-11 | Tests E2E sur les parcours critiques | 🟡 Could | Mateo | S3-8 | ⬜ |

**Livrable :** Parcours complet — attribution → échange → code promo délivré.

---

## Récapitulatif des responsabilités

| Membre | Focus principal |
|---|---|
| **Mario** | Backend API, DB, logique métier, règles sécurité |
| **Lucas** | UI/UX, composants React, interfaces Employeur & Employé |
| **Mateo** | Intégrations frontend↔backend, routing, services API, tests |

---

## Hors scope V1 (Won't Have)

- App native iOS/Android
- Conversion tokens → cash
- Marketplace partenaires ouverte (ajout self-service)
- Tableau de bord analytics avancé
- Multi-langue

---

## Définitions d'équipe à compléter

> Ces points sont marqués "À définir" dans le CLAUDE.md — à aligner en équipe avant Sprint 1 :

- [ ] Conventions de nommage (camelCase, kebab-case, etc.)
- [ ] Workflow Git : branches (`main`, `dev`, `feat/xxx`), PR obligatoire
- [ ] Stratégie de tests (Jest + Supertest backend, Vitest frontend ?)
- [ ] Conventions CSS/UI (Tailwind ? CSS Modules ?)
