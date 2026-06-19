# Prim'O

> Plateforme B2B2C de récompense instantanée - Tes efforts récompensés instantanément !

**Stack :** React · Express/Node.js · PostgreSQL · Prisma · JWT

---

## Prérequis

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL ≥ 15 (local ou Docker)

---

## Installation

### 1. Cloner le repo

```bash
git clone <URL_DU_REPO>
cd prim-o
```

### 2. Backend

```bash
cd backend
npm install

# Copier et remplir les variables d'environnement
cp .env.example .env
# → Editer .env : mettre DATABASE_URL, JWT_SECRET, etc.

# Générer le client Prisma + migrer la DB
npm run db:generate
npm run db:migrate

# (Optionnel) Insérer des données de test
npm run db:seed

# Démarrer en mode dev
npm run dev
# → API disponible sur http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install

# Copier les variables d'environnement
cp .env.example .env
# → Vérifier VITE_API_URL (par défaut http://localhost:4000/api)

# Démarrer en mode dev
npm run dev
# → App disponible sur http://localhost:5173
```

---

## Structure du projet

```
prim-o/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Schéma DB (entités, relations)
│   ├── src/
│   │   ├── controllers/        # Logique métier des routes
│   │   ├── routes/             # Définition des endpoints
│   │   ├── middlewares/        # Auth JWT, validation, etc.
│   │   ├── services/           # Services réutilisables (email, SMS)
│   │   └── utils/              # Helpers (validate.js, etc.)
│   ├── .env.example
│   ├── package.json
│   └── src/server.js           # Point d'entrée
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── employer/       # Composants interface Employeur
│       │   ├── employee/       # Composants interface Employé
│       │   └── shared/         # Composants partagés
│       ├── pages/
│       │   ├── employer/       # Pages back-office employeur
│       │   └── employee/       # Pages mobile employé
│       ├── hooks/              # Custom hooks React
│       ├── services/
│       │   └── api.js          # Client Axios configuré
│       ├── context/
│       │   └── AuthContext.jsx # Contexte d'authentification
│       └── utils/
│
├── SPRINT_PLAN.md              # Plan de sprints & MoSCoW
├── .gitignore
└── README.md
```

---

## Règles métier importantes

1. Le solde token ne peut **jamais** être négatif
2. **Pas de conversion token → cash** - uniquement échangeable contre des offres partenaires
3. Un compte employé nécessite une **double validation** (email + SMS) avant activation
4. Chaque attribution de tokens exige une **raison** (champ obligatoire)
5. Un code promo est délivré **exactement une fois** (opération atomique)
6. Un employeur ne peut gérer **que ses propres employés**

---

## Workflow Git

> À définir en équipe - suggestion :

```
main          → production
dev           → intégration
feat/xxx      → nouvelles features (PR obligatoire vers dev)
fix/xxx       → corrections de bugs
```

---

## Contacts

| Nom | Rôle |
|---|---|
| Mario Colomas | PM / Backend |
| Mateo Marques | Fullstack |
| Lucas Nevano | Frontend / UX |

**Communication :** Discord · **Tâches :** Notion · **Code :** GitHub
