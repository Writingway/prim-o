# Registre de Dette Technique - Décisions Non-Senior (Front & Back)

**Date :** 2026-06-17
**Statut :** Instantané d'audit. Pas un ordre de travail - à trier avant d'agir.

Catalogue des décisions discutables / non-senior trouvées dans `backend/src` et `frontend/src`. Chaque entrée : où, quoi, pourquoi ce n'est pas senior, le correctif senior, la sévérité.

> Note - ce qui EST senior et ne doit PAS être touché : access token gardé en mémoire uniquement (jamais en localStorage) dans `frontend/src/services/api/client.ts` ; validation Zod présente dans les controllers. Laisser tel quel.

---

## Backend

### B1 - Erreurs en chaînes de caractères + mapping manuel dans chaque controller - ÉLEVÉ
- **Où :** les services lèvent `throw new Error('EMAIL_TAKEN')` etc. (`auth.service.ts`, `attribution.service.ts`, `employee.service.ts`, `stripe.service.ts`, `invite.service.ts`, `company.service.ts`) ; les controllers remappent avec `if (err instanceof Error && err.message === 'X')` (`auth.controller.ts` et les autres).
- **Pourquoi ce n'est pas senior :** l'identité de l'erreur est une chaîne magique. Aucune sécurité de typage - une faute de frappe dans le `throw` ou dans la comparaison échoue silencieusement et renvoie un 500. La logique de mapping est dupliquée dans chaque controller. Pas de source unique de vérité pour savoir quel code → quel statut HTTP.
- **Correctif senior :** classes d'erreur typées (ex. `AppError` avec une enum `code` + `httpStatus`), levées par les services, mappées une seule fois dans un middleware Express central de gestion d'erreurs. Les controllers arrêtent de catcher par chaîne.

### B2 - Vérification d'email contournée - ÉLEVÉ (sécurité/correction)
- **Où :** `auth.service.ts:36` - `isEmailVerified: true, // Dette Technique TODO: should be false and send email verification`.
- **Pourquoi ce n'est pas senior :** n'importe qui peut s'inscrire avec un email qu'il ne possède pas. Le `true` codé en dur annule l'utilité du champ.
- **Correctif senior :** créer avec `false`, émettre un `EmailVerificationToken` (le modèle existe déjà), envoyer le mail de vérification, basculer à la confirmation. Bloquer les actions sensibles sur `verified`.

### B3 - OWNER créé avec le statut PENDING par défaut (bug de verrouillage) - ÉLEVÉ
- **Où :** `auth.service.ts` `registerCompany` - l'utilisateur est créé sans `status` explicite, donc il prend `PENDING` par défaut ; le propriétaire ne peut pas se connecter à son propre compte.
- **Pourquoi ce n'est pas senior :** livre un état où l'utilisateur du happy-path est verrouillé par défaut. (Traité dans la refonte de l'onboarding account-first - voir `2026-06-17-company-onboarding-design.md`.)
- **Correctif senior :** propriétaire / utilisateur flottant créé `APPROVED` ; capacité de l'entreprise gérée sur `Company.status`, pas sur le statut utilisateur.

### B4 - Entreprise + Utilisateur créés dans un appel couplé - MOYEN
- **Où :** `auth.service.ts` `registerCompany`.
- **Pourquoi ce n'est pas senior :** confond l'identité avec l'appartenance à une organisation ; aucun chemin pour qu'un utilisateur existe avant/sans entreprise. (Remplacé par l'onboarding account-first - voir le spec d'onboarding.)
- **Correctif senior :** voir `2026-06-17-company-onboarding-design.md`.

### B5 - `bcrypt.hash` en dehors de la transaction - FAIBLE
- **Où :** `auth.service.ts:49` - `const passwordHash = await bcrypt.hash(password, 12); // outside tx: slow`.
- **Pourquoi ce n'est pas senior :** le commentaire signale un point connu comme lent sans le résoudre. Hasher avant d'ouvrir la transaction est correct (évite de retenir une connexion), mais la vérification d'email en doublon se fait ensuite dans la transaction après un hash coûteux - travail gaspillé sur le chemin EMAIL_TAKEN.
- **Correctif senior :** vérification d'existence bon marché avant le hash, ou accepter le compromis et supprimer le commentaire trompeur. Impact faible.

### B6 - `any` issu de `jwt.verify` - FAIBLE
- **Où :** `backend/src/lib/token.ts` - le payload décodé n'est pas typé (`any`).
- **Pourquoi ce n'est pas senior :** perd la sécurité de typage sur le payload du token ; les lectures en aval ne sont pas vérifiées.
- **Correctif senior :** définir une interface `JwtPayload` et valider/narrower après `verify`.

### B7 - `console.log` au lieu d'un logger - FAIBLE
- **Où :** `backend/src/server.ts`, `backend/src/jobs/tokenCleanup.ts`.
- **Pourquoi ce n'est pas senior :** pas de niveaux, pas de structure, pas d'identifiants de corrélation ; bruyant en production.
- **Correctif senior :** un logger structuré (pino/winston) avec niveaux + contexte de requête.

---

## Frontend

### F1 - Rôle décodé depuis le JWT côté client - MOYEN
- **Où :** `frontend/src/services/api/auth.ts:16` - « le rôle se lit dans le JWT ».
- **Pourquoi ce n'est pas senior :** le client parse l'access token pour en déduire rôle/identité. Couple l'UI aux internes du token et fait l'impasse sur une source de profil propre. La refonte de l'onboarding a aussi besoin de `companyId` + `company.status`, que le JWT ne porte peut-être pas.
- **Correctif senior :** un endpoint `/me` renvoyant `role`, `companyId`, `company.status` comme source unique d'identité pour le frontend (déjà prévu dans le design d'onboarding).

### F2 - Style placeholder dans `AdminPage.css` - FAIBLE
- **Où :** `frontend/src/pages/AdminPage.css:1` - « design temporaire aligné sur la charte PRIM'O ».
- **Pourquoi ce n'est pas senior :** style explicitement marqué temporaire ; risque de livrer une UI placeholder.
- **Correctif senior :** intégrer au design system / composants partagés une fois les écrans admin finalisés.

### F3 - Routing fait main avec `useState` (pas de vrai routeur) - ÉLEVÉ
- **Où :** `frontend/src/App.tsx` - la navigation est gérée par des flags `useState` (`publicView: 'landing' | 'auth'`, `loggedView: 'landing' | 'dashboard'`, `authMode`). Aucune dépendance de routeur dans `package.json`. Le retour de paiement Stripe est détecté via `new URLSearchParams(window.location.search).get('payment')`.
- **Pourquoi ce n'est pas senior :**
  - **Pas d'URL = pas d'état partageable.** Aucune route ne correspond à un écran. Impossible de bookmarker, partager un lien, ou ouvrir un dashboard en deep-link.
  - **Bouton retour/avant du navigateur cassé.** L'historique n'est pas piloté ; revenir en arrière ne fait rien d'utile.
  - **Refresh = perte d'écran.** Recharger renvoie à l'état initial, pas à la vue courante.
  - **Callback Stripe bricolé.** Lire `?payment=` à la main au lieu d'une route dédiée (`/billing/return`) est fragile et non testable.
  - **Ne passe pas à l'échelle.** Onboarding (créer/rejoindre), dashboards par rôle (admin/manager/employé), pages légales… tout ça multiplie les `useState` et les branches conditionnelles dans un seul `App.tsx`.
- **Correctif senior - routeur 2026 pour une SPA React 19 + Vite :**
  - **Recommandé : TanStack Router.** Routeur type-safe de référence en 2026 pour les nouvelles SPA React : routes typées de bout en bout, `search params` validés (Zod, déjà utilisé côté back), `loaders` + `beforeLoad` pour les gardes d'auth/rôle, code-splitting natif. Colle au stack TS strict du projet.
  - **Alternative pragmatique : React Router v7 (mode déclaratif / library).** L'incumbent mûr, immense écosystème, friction de migration plus faible si l'équipe le connaît déjà. Moins de sécurité de typage que TanStack.
  - **À éviter ici :** Next.js / routeur full-framework - imposerait un changement de plateforme (SSR/serveur) hors périmètre d'une SPA Vite existante. Wouter - trop minimal pour les gardes par rôle dont on a besoin.
  - **Routes cibles minimales :** `/` (landing), `/auth`, `/onboarding` (créer/rejoindre - cf. refonte onboarding), `/dashboard` (résolu par rôle), `/admin`, `/billing/return` (callback Stripe). Gardes : non-connecté → `/auth` ; connecté sans entreprise → `/onboarding` ; entreprise `PENDING` → dashboard en mode bannière.

---

## Ordre suggéré

1. B3 + B4 → résolus par la refonte de l'onboarding account-first (déjà spécifiée).
2. F3 (vrai routeur) - à faire **avec** la refonte onboarding : les routes `/onboarding`, `/dashboard`, `/billing/return` en dépendent. Choix routeur à acter avant de coder le front.
3. B1 (erreurs typées + handler central) - débloque une UX d'erreur cohérente, y compris le `/me` de F1.
4. B2 (vérification d'email) - sécurité.
5. F1 (`/me` source de vérité) - lié à l'onboarding.
6. Items FAIBLE restants, de manière opportuniste.
