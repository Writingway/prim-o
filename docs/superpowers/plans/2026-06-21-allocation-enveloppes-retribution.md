# Allocation par enveloppes & rétribution manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la rétribution manager *par attribution* par un modèle *par enveloppe* : l'employeur crée une enveloppe (mode + montant) débitée du pool ; le manager l'ouvre, prend sa part calculée selon le mode, puis redistribue le reste à ses employés en un envoi atomique unique, avec motif obligatoire par ligne.

**Architecture:** Backend Express + Prisma (PostgreSQL). L'`Allocation` devient un objet à états (`A_DISTRIBUER` → `DISTRIBUEE`). La rétribution R est une fonction pure (`lib/retribution.ts`), recalculée côté serveur à l'envoi. L'envoi est une transaction Prisma unique : crédit manager (R) + création des `Attribution` (crédit employés) + passage de l'enveloppe à `DISTRIBUEE`, sous l'invariant `Σ(montants employés) = montant − R`. Ajout de `GET /api/motifs` (lecture seule) pour alimenter le sélecteur de motif.

**Tech Stack:** TypeScript, Express 5, Prisma 5.22 (épinglé — ne jamais `@latest`), Zod, PostgreSQL. Pas de framework de test : logique pure vérifiée par assertions `ts-node`, endpoints par `curl` contre le serveur lancé (convention `tests/smoke.sh`).

**Périmètre :** backend uniquement (l'UI « Mes enveloppes » est hors branche). Réf. spec : `docs/superpowers/specs/2026-06-21-allocation-enveloppes-retribution-design.md`.

---

## File Structure

| Fichier | Rôle | Action |
|---------|------|--------|
| `backend/prisma/schema.prisma` | enum `AllocationStatus` ; `Allocation.status/retributionAmount/distributedAt` ; `Attribution.allocationId` | Modifier |
| `backend/prisma/migrations/<ts>_allocation_envelopes/migration.sql` | migration additive | Créé (auto) |
| `backend/src/lib/retribution.ts` | fonction pure `computeRetribution` (R, arrondi plancher) | Créer |
| `backend/src/schemas/attribution.schemas.ts` | `distributeEnvelopeSchema` | Modifier |
| `backend/src/services/motif.service.ts` | `listActiveMotifs` | Créer |
| `backend/src/controllers/motif.controller.ts` | `listMotifsController` | Créer |
| `backend/src/routes/motif.routes.ts` | `GET /api/motifs` | Créer |
| `backend/src/services/attribution.service.ts` | `allocateToManager` (persiste l'enveloppe, plus de crédit manager), `distributeEnvelope`, `listManagerEnvelopes`, `getManagerBalances` | Modifier |
| `backend/src/controllers/attribution.controller.ts` | `allocateController` (mode/%), `distributeEnvelopeController`, `listEnvelopesController`, `balancesController` ; restreint `POST /` à OWNER | Modifier |
| `backend/src/routes/attribution.routes.ts` | routes `distribute` / `envelopes` / `balances` | Modifier |
| `backend/src/server.ts` | monter le router motifs | Modifier |
| `backend/src/contracts/manager.contracts.ts` | shapes réponses (allocate / distribute / envelopes) | Modifier |

**Pré-requis d'exécution (tous les tests endpoints) :** serveur lancé (`npm run dev`) + base seedée (`npx prisma db seed`). `BASE=http://localhost:4000/api`. Tous les comptes : `password123`.

---

## Task 1: Schéma de données — états d'enveloppe + lien attribution→enveloppe

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create (auto): `backend/prisma/migrations/<ts>_allocation_envelopes/migration.sql`

- [ ] **Step 1: Ajouter l'enum `AllocationStatus`**

Dans `schema.prisma`, juste après l'enum `RetributionMode` (vers la ligne 55) :

```prisma
// Cycle de vie d'une enveloppe (addendum v1.1, modèle "Mes enveloppes").
// Valeurs ASCII (contrainte Prisma) ; libellé FR géré à l'affichage.
enum AllocationStatus {
  A_DISTRIBUER  // créée par l'employeur, en attente d'ouverture par le manager
  DISTRIBUEE    // redistribuée et verrouillée (immuable)
}
```

- [ ] **Step 2: Étendre le modèle `Allocation`**

Remplacer le bloc des champs scalaires d'`Allocation` (lignes ~254-261) par :

```prisma
model Allocation {
  id          String           @id @default(uuid()) @db.Uuid
  amount      Int                              // taille de l'enveloppe. > 0 (Zod + CHECK)
  mode        RetributionMode
  percentage  Int?                             // mode POURCENTAGE uniquement : 1..100. null sinon.
  status      AllocationStatus @default(A_DISTRIBUER) // cycle de vie de l'enveloppe
  retributionAmount Int        @default(0)     // part R du manager, FIGÉE à l'envoi (0 tant que A_DISTRIBUER)
  distributedAt DateTime?                      // horodatage de l'envoi validé (null tant que A_DISTRIBUER)
  companyId   String           @db.Uuid
  managerId   String           @db.Uuid
  createdById String           @db.Uuid         // employeur/owner qui alloue
  createdAt   DateTime         @default(now())

  company   Company @relation(fields: [companyId], references: [id])
  manager   User    @relation("AllocationManager", fields: [managerId], references: [id])
  createdBy User    @relation("AllocationCreatedBy", fields: [createdById], references: [id])
  attributions Attribution[]                   // distributions issues de cette enveloppe

  @@index([companyId])
  @@index([managerId])
}
```

- [ ] **Step 3: Lier `Attribution` à son enveloppe**

Dans le modèle `Attribution`, ajouter le champ `allocationId` (après `employeeId`, ligne ~218) et la relation (après `motif`, ligne ~224), plus un index :

```prisma
  allocationId     String?  @db.Uuid              // enveloppe d'origine (addendum v1.1). Null pour distribution directe OWNER / lignes legacy.
```

```prisma
  allocation Allocation? @relation(fields: [allocationId], references: [id])
```

```prisma
  @@index([allocationId])
```

- [ ] **Step 4: Corriger le commentaire obsolète de `User.balance`**

Le champ `User.balance` (ligne ~89) sert désormais aussi au solde perso du manager (rétribution cumulée). Remplacer le commentaire :

```prisma
  balance         Int        @default(0)          // Portefeuille EMPLOYÉ + solde perso MANAGER (rétribution cumulée, addendum v1.1). CHECK >= 0 en SQL.
```

- [ ] **Step 5: Générer la migration**

Run:
```bash
cd backend && npx prisma migrate dev --name allocation_envelopes
```
Expected: migration créée et appliquée, client régénéré. Migration purement additive (colonnes nullable / avec défaut) → aucune perte de données. Si la base est désynchronisée : `npx prisma migrate reset` (réf. mémoire projet).

- [ ] **Step 6: Vérifier la compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: aucune erreur (le client Prisma régénéré expose `AllocationStatus`, `allocation`, `status`, etc.).

- [ ] **Step 7: Commit**

```bash
cd backend && git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): états d'enveloppe + lien attribution→allocation"
```

---

## Task 2: Fonction pure de rétribution (R)

**Files:**
- Create: `backend/src/lib/retribution.ts`

- [ ] **Step 1: Écrire le test (assertions ts-node)**

Run (échoue car le module n'existe pas encore) :
```bash
cd backend && npx ts-node -e "
import { computeRetribution } from './src/lib/retribution';
import assert from 'node:assert';
assert.strictEqual(computeRetribution({mode:'PART_EGALE',amount:1200,percentage:null,teamSize:5}),200);
assert.strictEqual(computeRetribution({mode:'PART_EGALE',amount:1000,percentage:null,teamSize:6}),142);
assert.strictEqual(computeRetribution({mode:'POURCENTAGE',amount:1000,percentage:30,teamSize:0}),300);
assert.strictEqual(computeRetribution({mode:'POURCENTAGE',amount:1050,percentage:33,teamSize:0}),346);
assert.strictEqual(computeRetribution({mode:'AUCUNE',amount:1000,percentage:null,teamSize:5}),0);
console.log('OK retribution');
"
```
Expected: FAIL — `Cannot find module './src/lib/retribution'`.

- [ ] **Step 2: Implémenter `computeRetribution`**

Create `backend/src/lib/retribution.ts`:
```ts
import type { RetributionMode } from '@prisma/client';

// Part de rétribution R du manager, prélevée sur l'enveloppe à l'envoi (addendum v1.1
// §3.4). Arrondi au PLANCHER : tout résidu reste dans le budget équipe (en faveur des
// salariés). Fonction pure et déterministe — testée isolément.
export function computeRetribution(params: {
  mode: RetributionMode;
  amount: number;
  percentage: number | null;
  teamSize: number; // nb d'employés actifs de l'entreprise (le manager est le +1)
}): number {
  const { mode, amount, percentage, teamSize } = params;
  switch (mode) {
    case 'PART_EGALE':
      return Math.floor(amount / (teamSize + 1));
    case 'POURCENTAGE':
      if (percentage == null) throw new Error('PERCENTAGE_REQUIRED');
      return Math.floor((amount * percentage) / 100);
    case 'AUCUNE':
      return 0;
    default:
      throw new Error('UNKNOWN_MODE');
  }
}
```

- [ ] **Step 3: Relancer le test**

Run: la même commande `ts-node` qu'au Step 1.
Expected: PASS — affiche `OK retribution`.

- [ ] **Step 4: Commit**

```bash
cd backend && git add src/lib/retribution.ts
git commit -m "feat: fonction pure computeRetribution (arrondi plancher)"
```

---

## Task 3: Endpoint `GET /api/motifs`

**Files:**
- Create: `backend/src/services/motif.service.ts`
- Create: `backend/src/controllers/motif.controller.ts`
- Create: `backend/src/routes/motif.routes.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Service `listActiveMotifs`**

Create `backend/src/services/motif.service.ts`:
```ts
import { prisma } from '../lib/db';

// Motifs officiels actifs, groupés par catégorie dans l'ordre métier.
// Conforme à ListMotifsResponse (contracts). Source du sélecteur de motif.
const CATEGORY_ORDER = [
  'COMPORTEMENTS_INDIVIDUELS',
  'RELATION_CLIENT',
  'ESPRIT_COLLECTIF',
  'ENGAGEMENT',
] as const;

export async function listActiveMotifs() {
  const motifs = await prisma.motif.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, tag: true, label: true, category: true, compliment: true },
  });
  const categories = CATEGORY_ORDER
    .map((category) => ({ category, motifs: motifs.filter((m) => m.category === category) }))
    .filter((g) => g.motifs.length > 0);
  return { categories };
}
```

- [ ] **Step 2: Contrôleur `listMotifsController`**

Create `backend/src/controllers/motif.controller.ts`:
```ts
import type { Request, Response, NextFunction } from 'express';
import { listActiveMotifs } from '../services/motif.service';

// GET /api/motifs — liste officielle des motifs actifs, groupés par catégorie.
export async function listMotifsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listActiveMotifs();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Route**

Create `backend/src/routes/motif.routes.ts`:
```ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listMotifsController } from '../controllers/motif.controller';

const router = Router();
router.get('/', requireAuth, listMotifsController);
export default router;
```

- [ ] **Step 4: Monter le router**

Dans `backend/src/server.ts`, ajouter l'import (près des autres routers, ~ligne 18) :
```ts
import motifRouter from './routes/motif.routes';
```
puis le montage (après la ligne `app.use('/api/attributions', attributionRouter);`, ~ligne 72) :
```ts
app.use('/api/motifs', motifRouter);
```

- [ ] **Step 5: Vérifier la compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Vérifier l'endpoint (serveur lancé + seed)**

Run:
```bash
BASE=http://localhost:4000/api
TOK=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"manager@acme.fr","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | sed 's/.*:"//;s/"//')
curl -s $BASE/motifs -H "Authorization: Bearer $TOK"
```
Expected: JSON `{"categories":[{"category":"COMPORTEMENTS_INDIVIDUELS","motifs":[...4...]},...]}` — 4 catégories, 13 motifs au total.

- [ ] **Step 7: Commit**

```bash
cd backend && git add src/services/motif.service.ts src/controllers/motif.controller.ts src/routes/motif.routes.ts src/server.ts
git commit -m "feat: GET /api/motifs (motifs actifs groupés par catégorie)"
```

---

## Task 4: Création d'enveloppe — persister l'`Allocation`, ne plus créditer le manager

**Files:**
- Modify: `backend/src/services/attribution.service.ts:73-113` (`allocateToManager`)
- Modify: `backend/src/controllers/attribution.controller.ts:44-76` (`allocateController`)

- [ ] **Step 1: Réécrire `allocateToManager`**

D'abord, ajouter l'import en **tête de fichier** `backend/src/services/attribution.service.ts` (après la ligne 2, `import { Prisma } from '@prisma/client';`) :
```ts
import type { RetributionMode } from '@prisma/client';
```
Puis remplacer toute la fonction `allocateToManager` (lignes 71-113) par :
```ts
// Allocation employeur → manager : débite le POOL entreprise et CRÉE une enveloppe
// (Allocation, statut A_DISTRIBUER). NE crédite PLUS le solde du manager : les tokens
// "vivent" dans l'enveloppe jusqu'à l'envoi (où R lui est crédité). Atomique + gardé.
export async function allocateToManager(
  companyId: string,
  createdById: string,
  managerId: string,
  amount: number,
  mode: RetributionMode,
  percentage: number | null,
) {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, role: true, companyId: true, deletedAt: true },
  });
  if (!manager || manager.deletedAt !== null || manager.role !== 'MANAGER') {
    throw new Error('MANAGER_NOT_FOUND');
  }
  if (manager.companyId !== companyId) throw new Error('MANAGER_NOT_IN_COMPANY');

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  if (company.status !== 'APPROVED') throw new Error('COMPANY_INACTIVE');

  try {
    return await prisma.$transaction(async (tx) => {
      const debit = await tx.company.updateMany({
        where: { id: companyId, tokenBalance: { gte: amount } },
        data: { tokenBalance: { decrement: amount } },
      });
      if (debit.count === 0) throw new Error('INSUFFICIENT_POOL');

      const allocation = await tx.allocation.create({
        data: { amount, mode, percentage, companyId, managerId, createdById, status: 'A_DISTRIBUER' },
        select: { id: true, amount: true, mode: true, percentage: true, status: true },
      });
      const refreshed = await tx.company.findUnique({
        where: { id: companyId },
        select: { tokenBalance: true },
      });
      return { allocation, companyTokenBalance: refreshed?.tokenBalance ?? 0 };
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientUnknownRequestError &&
      err.message.includes('company_pool_non_negative')
    ) {
      throw new Error('INSUFFICIENT_POOL');
    }
    throw err;
  }
}
```
(`Prisma` est déjà importé en tête de fichier ligne 2.)

- [ ] **Step 2: Mettre à jour `allocateController`**

Dans `backend/src/controllers/attribution.controller.ts`, dans `allocateController`, remplacer le bloc (lignes 59-61) :
```ts
    const { managerId, amount } = allocateSchema.parse(req.body);
    const manager = await allocateToManager(companyId, managerId, amount);
    res.status(201).json({ manager });
```
par :
```ts
    const { managerId, amount, mode, percentage } = allocateSchema.parse(req.body);
    const { allocation, companyTokenBalance } = await allocateToManager(
      companyId, req.user.id, managerId, amount, mode, percentage ?? null,
    );
    res.status(201).json({
      allocationId: allocation.id,
      managerId,
      amount: allocation.amount,
      mode: allocation.mode,
      percentage: allocation.percentage,
      status: allocation.status,
      companyTokenBalance,
    });
```

- [ ] **Step 3: Vérifier la compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérifier l'allocation (serveur + seed)**

Run:
```bash
BASE=http://localhost:4000/api
OTOK=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"boss@acme.fr","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | sed 's/.*:"//;s/"//')
MID=$(curl -s $BASE/attributions/managers -H "Authorization: Bearer $OTOK" | grep -o '"id":"[^"]*"' | head -1 | sed 's/.*:"//;s/"//')
curl -s -X POST $BASE/attributions/allocate -H "Authorization: Bearer $OTOK" -H 'Content-Type: application/json' \
  -d "{\"managerId\":\"$MID\",\"amount\":12,\"mode\":\"PART_EGALE\"}"
```
Expected: `201` avec `{"allocationId":"...","status":"A_DISTRIBUER","mode":"PART_EGALE","companyTokenBalance":<pool-12>,...}`. Le solde du manager n'a PAS bougé (vérifié au Task 5).

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/services/attribution.service.ts src/controllers/attribution.controller.ts
git commit -m "feat: l'allocation crée une enveloppe (sans créditer le manager)"
```

---

## Task 5: Envoi / redistribution atomique de l'enveloppe

**Files:**
- Modify: `backend/src/schemas/attribution.schemas.ts`
- Modify: `backend/src/services/attribution.service.ts` (ajout `distributeEnvelope`)
- Modify: `backend/src/controllers/attribution.controller.ts` (ajout `distributeEnvelopeController`)
- Modify: `backend/src/routes/attribution.routes.ts`

- [ ] **Step 1: Schéma Zod de l'envoi**

Dans `backend/src/schemas/attribution.schemas.ts`, ajouter à la fin :
```ts
// Envoi groupé manager → employés depuis une enveloppe (§3.3). Redistribution COMPLÈTE
// et atomique : chaque ligne a un motif obligatoire ; un employé n'apparaît qu'une fois.
export const distributeEnvelopeSchema = z.object({
  allocationId: z.uuid(),
  lines: z
    .array(
      z.object({
        employeeId: z.uuid(),
        amount:     z.number().int().positive(),
        motifId:    z.uuid(),
        reason:     safeText(1).optional(),
      }),
    )
    .min(1)
    .refine(
      (lines) => new Set(lines.map((l) => l.employeeId)).size === lines.length,
      { message: 'Un employé ne peut apparaître qu’une seule fois dans la répartition.' },
    ),
});

export type DistributeEnvelopeInput = z.infer<typeof distributeEnvelopeSchema>;
```

- [ ] **Step 2: Service `distributeEnvelope`**

Dans `backend/src/services/attribution.service.ts`, ajouter l'import en tête (après la ligne 3) :
```ts
import { computeRetribution } from '../lib/retribution';
import type { DistributeEnvelopeInput } from '../schemas/attribution.schemas';
```
puis ajouter la fonction (après `allocateToManager`) :
```ts
// Envoi atomique d'une enveloppe : recalcule R, vérifie l'invariant Σ(montants) =
// montant − R, crédite le manager (R) + chaque employé, marque l'enveloppe DISTRIBUEE.
// Tout échec → rollback complet, l'enveloppe reste A_DISTRIBUER.
export async function distributeEnvelope(
  managerId: string,
  companyId: string,
  input: DistributeEnvelopeInput,
) {
  const { allocationId, lines } = input;
  return prisma.$transaction(async (tx) => {
    const alloc = await tx.allocation.findUnique({
      where: { id: allocationId },
      select: { id: true, amount: true, mode: true, percentage: true, status: true, managerId: true, companyId: true },
    });
    if (!alloc) throw new Error('ALLOCATION_NOT_FOUND');
    if (alloc.managerId !== managerId) throw new Error('ALLOCATION_NOT_OWNED');
    if (alloc.companyId !== companyId) throw new Error('ALLOCATION_NOT_IN_COMPANY');
    if (alloc.status !== 'A_DISTRIBUER') throw new Error('ALLOCATION_ALREADY_DISTRIBUTED');

    // nbEquipe = employés actifs de l'entreprise au moment de l'envoi (le manager = +1).
    const teamSize = await tx.user.count({
      where: { companyId, role: 'EMPLOYEE', deletedAt: null },
    });
    const retribution = computeRetribution({
      mode: alloc.mode,
      amount: alloc.amount,
      percentage: alloc.percentage,
      teamSize,
    });
    const budget = alloc.amount - retribution;

    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    if (total !== budget) throw new Error('DISTRIBUTION_MISMATCH');

    // Tous les destinataires doivent être des employés actifs de l'entreprise.
    const employeeIds = lines.map((l) => l.employeeId);
    const validEmployees = await tx.user.count({
      where: { id: { in: employeeIds }, companyId, role: 'EMPLOYEE', deletedAt: null },
    });
    if (validEmployees !== employeeIds.length) throw new Error('EMPLOYEE_INVALID');

    // Tous les motifs doivent exister et être actifs.
    const motifIds = [...new Set(lines.map((l) => l.motifId))];
    const validMotifs = await tx.motif.count({ where: { id: { in: motifIds }, active: true } });
    if (validMotifs !== motifIds.length) throw new Error('MOTIF_INVALID');

    // Crédit rétribution manager (solde perso).
    if (retribution > 0) {
      await tx.user.update({ where: { id: managerId }, data: { balance: { increment: retribution } } });
    }
    // Crédit employés + création des attributions, rattachées à l'enveloppe.
    for (const l of lines) {
      await tx.user.update({ where: { id: l.employeeId }, data: { balance: { increment: l.amount } } });
      await tx.attribution.create({
        data: {
          amount: l.amount,
          reason: l.reason ?? '',
          motifId: l.motifId,
          companyId,
          managerId,
          employeeId: l.employeeId,
          allocationId,
        },
      });
    }
    await tx.allocation.update({
      where: { id: allocationId },
      data: { status: 'DISTRIBUEE', retributionAmount: retribution, distributedAt: new Date() },
    });

    return { allocationId, retributionAmount: retribution, distributed: total, lineCount: lines.length, status: 'DISTRIBUEE' as const };
  });
}
```

- [ ] **Step 3: Contrôleur `distributeEnvelopeController`**

Dans `backend/src/controllers/attribution.controller.ts`, ajouter les imports nécessaires : dans l'import du schéma (ligne 3) ajouter `distributeEnvelopeSchema`, et dans l'import du service ajouter `distributeEnvelope`. Puis ajouter le contrôleur :
```ts
// POST /api/attributions/distribute — le manager redistribue une enveloppe (envoi unique).
export async function distributeEnvelopeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    const input = distributeEnvelopeSchema.parse(req.body);
    const result = await distributeEnvelope(ctx.userId, ctx.companyId, input);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        ALLOCATION_NOT_FOUND:           [404, 'Enveloppe introuvable.'],
        ALLOCATION_NOT_OWNED:           [403, "Cette enveloppe ne t'appartient pas."],
        ALLOCATION_NOT_IN_COMPANY:      [403, "Cette enveloppe n'appartient pas à ton entreprise."],
        ALLOCATION_ALREADY_DISTRIBUTED: [409, 'Cette enveloppe a déjà été distribuée.'],
        DISTRIBUTION_MISMATCH:          [422, "Le total distribué doit égaler le budget de l'enveloppe."],
        EMPLOYEE_INVALID:               [422, 'Un ou plusieurs employés sont invalides.'],
        MOTIF_INVALID:                  [422, 'Un ou plusieurs motifs sont invalides ou inactifs.'],
      };
      const mapped = map[err.message];
      if (mapped) { next(new AppError(mapped[0], mapped[1])); return; }
    }
    next(err);
  }
}
```

- [ ] **Step 4: Route**

Dans `backend/src/routes/attribution.routes.ts`, ajouter `distributeEnvelopeController` à l'import du contrôleur, puis la route (après la ligne `router.post('/allocate', ...)`) :
```ts
router.post('/distribute', requireAuth, distributeEnvelopeController);
```

- [ ] **Step 5: Vérifier la compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Vérifier le flux complet (serveur + seed reset)**

Run:
```bash
cd backend && npx prisma migrate reset --force && npx prisma db seed   # base propre
BASE=http://localhost:4000/api
OTOK=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"boss@acme.fr","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | sed 's/.*:"//;s/"//')
MTOK=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"manager@acme.fr","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | sed 's/.*:"//;s/"//')
MID=$(curl -s $BASE/attributions/managers -H "Authorization: Bearer $OTOK" | grep -o '"id":"[^"]*"' | head -1 | sed 's/.*:"//;s/"//')
# Acme : 2 employés actifs (jean, marie). PART_EGALE amount=12 → R = floor(12/3) = 4, budget 8.
ALLOC=$(curl -s -X POST $BASE/attributions/allocate -H "Authorization: Bearer $OTOK" -H 'Content-Type: application/json' -d "{\"managerId\":\"$MID\",\"amount\":12,\"mode\":\"PART_EGALE\"}")
AID=$(printf '%s' "$ALLOC" | grep -o '"allocationId":"[^"]*"' | sed 's/.*:"//;s/"//')
# employés + un motif actif
EMP=$(curl -s $BASE/employees -H "Authorization: Bearer $MTOK")
echo "ALLOC=$ALLOC"; echo "EMP(ids)=$(printf '%s' "$EMP" | grep -o '"id":"[^"]*"')"
MOTIF=$(curl -s $BASE/motifs -H "Authorization: Bearer $MTOK" | grep -o '"id":"[^"]*"' | head -1 | sed 's/.*:"//;s/"//')
# Renseigner JEAN et MARIE (ids lus ci-dessus) puis :
# curl -s -X POST $BASE/attributions/distribute -H "Authorization: Bearer $MTOK" -H 'Content-Type: application/json' \
#   -d "{\"allocationId\":\"$AID\",\"lines\":[{\"employeeId\":\"<JEAN>\",\"amount\":4,\"motifId\":\"$MOTIF\"},{\"employeeId\":\"<MARIE>\",\"amount\":4,\"motifId\":\"$MOTIF\"}]}"
```
Expected:
- L'envoi avec `4 + 4 = 8` (= budget) → `201` `{"retributionAmount":4,"distributed":8,"status":"DISTRIBUEE",...}`.
- Rejouer le même envoi → `409 ALLOCATION_ALREADY_DISTRIBUTED`.
- Un envoi dont la somme ≠ 8 (ex. `4 + 3`) → `422 DISTRIBUTION_MISMATCH`.
- Un envoi avec un `motifId` aléatoire → `422 MOTIF_INVALID`.

- [ ] **Step 7: Commit**

```bash
cd backend && git add src/schemas/attribution.schemas.ts src/services/attribution.service.ts src/controllers/attribution.controller.ts src/routes/attribution.routes.ts
git commit -m "feat: envoi atomique d'enveloppe (rétribution + redistribution complète)"
```

---

## Task 6: Enveloppes du manager + doubles soldes

**Files:**
- Modify: `backend/src/services/attribution.service.ts` (ajout `listManagerEnvelopes`, `getManagerBalances`)
- Modify: `backend/src/controllers/attribution.controller.ts` (ajout `listEnvelopesController`, `balancesController`)
- Modify: `backend/src/routes/attribution.routes.ts`

- [ ] **Step 1: Services lecture seule**

Dans `backend/src/services/attribution.service.ts`, ajouter :
```ts
// Liste les enveloppes d'un manager ("Mes enveloppes"). Pour A_DISTRIBUER, R et le
// budget sont calculés en direct (taille d'équipe courante) ; pour DISTRIBUEE on relit
// le R figé à l'envoi.
export async function listManagerEnvelopes(managerId: string, companyId: string) {
  const allocations = await prisma.allocation.findMany({
    where: { managerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, amount: true, mode: true, percentage: true, status: true,
      retributionAmount: true, distributedAt: true, createdAt: true,
    },
  });
  const teamSize = await prisma.user.count({ where: { companyId, role: 'EMPLOYEE', deletedAt: null } });
  return allocations.map((a) => {
    const retribution = a.status === 'DISTRIBUEE'
      ? a.retributionAmount
      : computeRetribution({ mode: a.mode, amount: a.amount, percentage: a.percentage, teamSize });
    return {
      allocationId: a.id,
      amount: a.amount,
      mode: a.mode,
      percentage: a.percentage,
      status: a.status,
      retributionAmount: retribution,
      distributableBudget: a.amount - retribution,
      distributedAt: a.distributedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    };
  });
}

// Doubles soldes manager (§3.3) : enveloppe restante (budget non distribué des
// enveloppes A_DISTRIBUER) + solde perso (rétribution cumulée = user.balance).
export async function getManagerBalances(managerId: string, companyId: string) {
  const user = await prisma.user.findUnique({ where: { id: managerId }, select: { balance: true } });
  const pending = await prisma.allocation.findMany({
    where: { managerId, status: 'A_DISTRIBUER' },
    select: { amount: true, mode: true, percentage: true },
  });
  const teamSize = await prisma.user.count({ where: { companyId, role: 'EMPLOYEE', deletedAt: null } });
  const envelopeRemaining = pending.reduce((sum, a) => {
    const r = computeRetribution({ mode: a.mode, amount: a.amount, percentage: a.percentage, teamSize });
    return sum + (a.amount - r);
  }, 0);
  return { envelopeRemaining, personalBalance: user?.balance ?? 0 };
}
```

- [ ] **Step 2: Contrôleurs**

Dans `backend/src/controllers/attribution.controller.ts`, ajouter `listManagerEnvelopes` et `getManagerBalances` à l'import du service, puis :
```ts
// GET /api/attributions/envelopes — enveloppes du manager courant ("Mes enveloppes").
export async function listEnvelopesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;
    const envelopes = await listManagerEnvelopes(ctx.userId, ctx.companyId);
    res.status(200).json({ envelopes });
  } catch (err) {
    next(err);
  }
}

// GET /api/attributions/balances — doubles soldes du manager courant.
export async function balancesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;
    const balances = await getManagerBalances(ctx.userId, ctx.companyId);
    res.status(200).json(balances);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Routes**

Dans `backend/src/routes/attribution.routes.ts`, ajouter `listEnvelopesController` et `balancesController` à l'import, puis :
```ts
router.get('/envelopes', requireAuth, listEnvelopesController);
router.get('/balances', requireAuth, balancesController);
```

- [ ] **Step 4: Vérifier la compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérifier (serveur, après le flux du Task 5)**

Run:
```bash
BASE=http://localhost:4000/api
MTOK=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"manager@acme.fr","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | sed 's/.*:"//;s/"//')
curl -s $BASE/attributions/envelopes -H "Authorization: Bearer $MTOK"
curl -s $BASE/attributions/balances  -H "Authorization: Bearer $MTOK"
```
Expected :
- `envelopes` liste l'enveloppe distribuée (`status:"DISTRIBUEE"`, `retributionAmount:4`, `distributableBudget:8`).
- `balances` : `personalBalance` = somme des R encaissés (4 après le Task 5) ; `envelopeRemaining` = budget des enveloppes encore `A_DISTRIBUER` (0 si tout est distribué).

- [ ] **Step 6: Commit**

```bash
cd backend && git add src/services/attribution.service.ts src/controllers/attribution.controller.ts src/routes/attribution.routes.ts
git commit -m "feat: enveloppes du manager + doubles soldes (lecture)"
```

---

## Task 7: Restreindre la distribution directe aux OWNER + aligner les contrats

**Files:**
- Modify: `backend/src/controllers/attribution.controller.ts` (`createAttributionController`)
- Modify: `backend/src/contracts/manager.contracts.ts`

- [ ] **Step 1: Réserver `POST /api/attributions` à l'OWNER**

La distribution unitaire directe reste pour le cas TPE (employeur → employé). Le manager passe désormais OBLIGATOIREMENT par les enveloppes. Dans `createAttributionController`, juste après `if (!ctx) return;` (ligne ~20), ajouter :
```ts
    if (ctx.role === 'MANAGER') {
      next(new AppError(403, 'Les managers distribuent via leurs enveloppes (/attributions/distribute).'));
      return;
    }
```

- [ ] **Step 2: Mettre à jour les contrats**

Dans `backend/src/contracts/manager.contracts.ts`, remplacer l'interface `AllocateResponse` (lignes ~35-42) par :
```ts
export interface AllocateResponse {
  allocationId: string;
  managerId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  companyTokenBalance: number; // pool employeur restant après débit
}
```
Remplacer l'interface `DistributeResponse` (lignes ~47-54) par :
```ts
// POST /api/attributions/distribute — envoi groupé d'une enveloppe (transaction atomique).
export interface DistributeEnvelopeResponse {
  allocationId: string;
  retributionAmount: number; // part créditée au manager (§3.4) ; 0 si AUCUNE
  distributed: number;       // total distribué aux employés (= montant − R)
  lineCount: number;         // nb d'attributions créées
  status: 'DISTRIBUEE';
}
```
Ajouter, après `ManagerBalancesResponse` (ligne ~61), le DTO des enveloppes :
```ts
// GET /api/attributions/envelopes — "Mes enveloppes" du manager.
export interface ManagerEnvelopeDTO {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  retributionAmount: number;    // R (live si A_DISTRIBUER, figé si DISTRIBUEE)
  distributableBudget: number;  // montant − R
  distributedAt: string | null; // ISO
  createdAt: string;            // ISO
}
export interface ManagerEnvelopesResponse {
  envelopes: ManagerEnvelopeDTO[];
}
```

- [ ] **Step 3: Vérifier la compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérifier la garde OWNER (serveur)**

Run:
```bash
BASE=http://localhost:4000/api
MTOK=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"email":"manager@acme.fr","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | sed 's/.*:"//;s/"//')
JID=$(curl -s $BASE/employees -H "Authorization: Bearer $MTOK" | grep -o '"id":"[^"]*"' | head -1 | sed 's/.*:"//;s/"//')
MOTIF=$(curl -s $BASE/motifs -H "Authorization: Bearer $MTOK" | grep -o '"id":"[^"]*"' | head -1 | sed 's/.*:"//;s/"//')
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/attributions -H "Authorization: Bearer $MTOK" -H 'Content-Type: application/json' \
  -d "{\"employeeId\":\"$JID\",\"amount\":1,\"motifId\":\"$MOTIF\"}"
```
Expected: `403` (le manager ne peut plus distribuer directement).

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/controllers/attribution.controller.ts src/contracts/manager.contracts.ts
git commit -m "feat: distribution directe réservée OWNER + contrats enveloppes"
```

---

## Coordination (rappel)

Les contrats gelés `manager.contracts.ts` changent (Task 7) — modification à acter avec Dev A / Dev B / Dev C avant gel des nouvelles shapes (voir spec, section « Points de coordination »).
