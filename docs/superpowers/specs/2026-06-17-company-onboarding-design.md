# Refonte de l'Onboarding Entreprise — Account-First

**Date :** 2026-06-17
**Statut :** Approuvé (design)

## Problème

L'inscription actuelle crée une Entreprise + un utilisateur OWNER en un seul appel. Deux problèmes :

1. **Préoccupations confondues.** L'identité d'un utilisateur et son appartenance à une entreprise sont couplées en une seule action. Modèle peu solide — une personne est un utilisateur ; appartenir à une entreprise est séparé.
2. **Bug de verrouillage.** L'utilisateur OWNER est créé avec `status` par défaut à `PENDING`, donc le propriétaire ne peut pas se connecter à son propre compte tant qu'un admin ne le bascule pas manuellement.

## Décision

Passer à un **onboarding account-first** (pattern SaaS standard — Slack/Notion/Linear) : identité ≠ appartenance à une organisation.

Un utilisateur s'inscrit / se connecte en tant qu'utilisateur simple. Un utilisateur sans entreprise atterrit sur un écran de choix : **Créer une entreprise** ou **Rejoindre une entreprise**.

**Garde-fou de périmètre :** l'appartenance à une seule entreprise est conservée. `User.companyId` reste une FK unique nullable. Pas de table de jointure `Membership` many-to-many — le multi-org n'est pas une exigence et ce refactor toucherait chaque référence à `companyId` (YAGNI).

## Design

### 1. Schéma (migration Prisma)

- `User.role` → **nullable**. `null` = utilisateur flottant, pas encore dans une entreprise.
- `User.companyId` — déjà nullable. Assouplir la règle « null seulement pour ADMIN » : `null` = ADMIN **ou** pas encore rattaché.
- État utilisateur flottant : `role = null`, `companyId = null`. L'identité est valide immédiatement (sous réserve de `isEmailVerified`) ; la capacité entreprise est gérée sur `Company.status`.

Sémantique des états :
- `User.status` — **supprimé** (enum `UserStatus` + colonne + check `USER_NOT_APPROVED`). Devenu redondant : l'approbation onboarding passe désormais par le code d'invitation, la validation email par `isEmailVerified`, et la désactivation d'un employé parti par `deletedAt` (soft-delete, déjà présent). Disparaissent avec : `approveEmployee`, l'écran « employés en attente » du manager. Rejoindre via code = actif direct.
- `isEmailVerified` — **conservé**. Validation email, gate indépendant au login.
- `Company.status` — entreprise en attente de validation *admin*. Le vrai gate de la capacité propriétaire/entreprise.

### 2. Endpoints d'authentification (remplacent les deux anciens)

- `POST /auth/register` — crée un utilisateur flottant, renvoie les tokens → connecté immédiatement.
- `POST /auth/create-company` *(authentifié)* — crée une entreprise `PENDING`, met l'appelant `role = OWNER`, `companyId`.
- `POST /auth/join-company` *(authentifié)* — chemin par code d'invitation ; met `role = EMPLOYEE` (ou le rôle du code) + `companyId`. Le code valide = employé actif direct, plus d'approbation manager. Adapte le `registerUser` actuel.
- Les anciens `POST /auth/register-company` et `POST /auth/register-user` sont supprimés.

### 3. Routage après connexion (frontend)

- `companyId == null` → **écran d'onboarding : Créer une entreprise / Rejoindre une entreprise.**
- A une entreprise → dashboard, gardé sur `Company.status` :
  - `PENDING` → bannière *« Entreprise en cours de validation — un admin va l'approuver bientôt. »* Autorisé : voir le dashboard, modifier profil + nom d'entreprise. Grisé avec « disponible après validation » : acheter des tokens, inviter des employés, créer des attributions.
  - `APPROVED` → dashboard complet.
  - `REJECTED` → état bloqué, message « entreprise rejetée ».

### 4. Endpoint `/me`

Renvoie `role`, `companyId`, et `company.status` pour que le frontend route correctement.

### 5. Gardes backend (défense en profondeur — ne pas faire confiance au frontend)

Les actions entreprise (acheter des tokens / inviter des employés / créer une attribution) exigent :
`companyId != null` + rôle approprié + `Company.status === APPROVED`.
Sinon `403 COMPANY_NOT_APPROVED`.

### 6. Validation/Rejet admin (deltas frontend AdminCompanies)

Badge de statut + boutons Approuver/Rejeter.
- Approuver → `Company.status = APPROVED`. Le propriétaire est déjà utilisable ; rien d'autre à faire.
- Rejeter → `Company.status = REJECTED`.

### 7. Tests (smoke.sh)

- register (flottant) → login → create-company → acheter tokens (attendu **403**, entreprise PENDING) → admin approuve → acheter tokens (attendu **200**).
- register → join-company avec code d'invitation → dashboard employé.

## Vérifications à faire avant l'implémentation

- Confirmer si `admin.service` a déjà approve/reject et ce qu'il définit.
- Confirmer qu'un endpoint de type `/me` existe et ce qu'il renvoie actuellement.
