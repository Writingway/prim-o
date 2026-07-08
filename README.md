# Prim'O

> Plateforme B2B2C de récompense instantanée - Tes efforts récompensés instantanément !

**Stack :** React · Express/Node.js · PostgreSQL · Prisma

---

## Key Business Flows

Diagrams of the main user journeys are available in `Documentation/img_doc/`:

- **Authentication (JWT)**: `User Login (JWT).png`
- **Employer token management**: `Employer Token Management.png`
- **Employee token usage and promo codes**: `Employee Token Usage & Promo Code.png`
- **Stripe payment flow**: `Stripe Payment Flow.png`

---

## Requirements

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL ≥ 15 (local, ou via le `docker-compose.yml` fourni)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Writingway/prim-o.git
cd prim-o
```

### 2. Base de données (option Docker)

```bash
docker compose up -d   # démarre PostgreSQL
```

### 3. Backend

```bash
cd backend
npm install

# Variables d'environnement
cp .env.example .env
# → Renseigner : DATABASE_URL, JWT_SECRET, CLIENT_URL, PORT, NODE_ENV,
#   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TOKEN_PRICE_CENTS,
#   BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDERNAME

# Prisma : générer le client + appliquer les migrations
npx prisma generate
npx prisma migrate dev

# (Optionnel) Jeu de données de test
npx prisma db seed

# Lancer en dev
npm run dev
# → API sur http://localhost:4000
```

> Sans `BREVO_API_KEY`, les liens de vérification / réinitialisation sont **loggés en console** — pratique pour tester les flux e-mail en local.

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # vérifier VITE_API_URL

npm run dev
# → App sur http://localhost:5173
```

---

## Project Structure

```
prim-o/
├── backend/                  # Express + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma        # Schéma DB (entités, relations, enums)
│   │   └── migrations/          # Migrations SQL versionnées
│   ├── src/
│   │   ├── routes/              # Définition des endpoints REST
│   │   ├── middleware/          # auth, authz (RBAC), gestion d'erreurs
│   │   ├── controllers/         # Glue HTTP (parse, valide, met en forme)
│   │   ├── services/            # Logique métier + accès Prisma
│   │   ├── schemas/             # Validation Zod + types inférés
│   │   ├── lib/                 # db, token, mail, stripe, rateLimit, upload
│   │   ├── jobs/                # Tâches planifiées (RGPD, purge tokens)
│   │   ├── types/               # Déclarations TS (ex. express.d.ts)
│   │   └── server.ts            # Point d'entrée
│   └── tests/
│       ├── unit/                # Tests unitaires (Vitest)
│       └── integration/         # Tests d'intégration (Vitest + Supertest)
│
├── frontend/
│   └── src/
│       ├── pages/               # Pages par rôle (Employee, Manager, Owner, Admin…)
│       ├── components/          # Composants (auth, dashboard, offers, admin, ui…)
│       ├── hooks/               # Hooks React custom
│       ├── services/api/        # Client API typé (transport, refresh, endpoints)
│       ├── lib/                 # Helpers (format, avatars, cropImage)
│       ├── types/               # Types partagés
│       ├── router.tsx           # Routage + guards
│       └── main.tsx             # Point d'entrée
│
├── docker-compose.yml           # PostgreSQL
├── Documentation/               # Docs projet (Stages 1 à 4)
└── README.md
```

---

## Tests

| Périmètre | Outils | Localisation |
|---|---|---|
| Backend — unitaire | Vitest | `backend/tests/unit` |
| Backend — intégration (API) | Vitest + Supertest | `backend/tests/integration` |
| Frontend — composants / routing | Vitest + Testing Library | `frontend/tests`, `frontend/src/**/*.test.tsx` |

```bash
# Backend
cd backend
npm run test        # unitaires
npm run test:int    # intégration (DB de test)

# Frontend
cd frontend
npm run test
```

Portée testée : flux d'authentification, RBAC (accès autorisés/refusés par rôle), cohérence du ledger de tokens, cas de concurrence (réservation de code promo), validation des entrées. Les rate limiters sont désactivés en `NODE_ENV=test`.

> Portes de qualité exécutées localement avant merge : `tsc --noEmit` (front + back), ESLint, Vitest. La mise en place d'un pipeline CI est identifiée comme amélioration (voir `Documentation/`).

---

## Workflow Git

```
main          → production (stable)
develop       → intégration
feat/xxx      → nouvelles features   (PR vers develop)
fix/xxx       → corrections de bugs  (PR vers develop)
```

Chaque feature passe par une **Pull Request** relue avant merge dans `develop`. `develop` est fusionné dans `main` pour les livraisons.

---

## Équipe

| Nom | Rôle |
|---|---|
| Mario Colomas | PM / Backend |
| Mateo Marques | Fullstack |
| Lucas Nevano | Frontend / UX |

**Communication :** Discord · **Suivi :** Notion · **Code :** GitHub
