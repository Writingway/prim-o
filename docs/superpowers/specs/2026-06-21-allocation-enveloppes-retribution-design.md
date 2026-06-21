# Allocation par enveloppes & rétribution manager — Design

**Date :** 2026-06-21
**Branche :** `feature/allocation`
**Périmètre :** logique backend d'allocation de tokens uniquement (l'UI « Mes enveloppes » est hors périmètre de cette branche, mais le backend l'alimente).

## Contexte

L'addendum v1.1 (§3.2/§3.4) définit 3 modes de rétribution du manager. La logique a
été revue : au lieu d'une rétribution calculée *par attribution* (modèle actuel du
schéma, champ `Attribution.retributionAmount`), on adopte un modèle **par enveloppe**
qui correspond à l'expérience produit voulue : chaque allocation employeur → manager
est une **enveloppe** distincte dans l'onglet « Mes enveloppes » du manager. Le manager
l'ouvre, prend sa part, redistribue le reste à ses employés, et l'enveloppe se
**verrouille** une fois la redistribution validée.

## Modèle conceptuel

### Objets

1. **Pool entreprise** — `company.tokenBalance`. Inchangé.
2. **Enveloppe = `Allocation`** — objet concret affiché dans « Mes enveloppes ». Créée
   par l'employeur avec un montant, un mode (+ % si POURCENTAGE) et un manager
   destinataire. Porte la logique du mode.
3. **Distribution = `Attribution`** — crédit d'un employé, rattaché à une enveloppe.

### États de l'enveloppe

- **`A_DISTRIBUER`** — créée par l'employeur, en attente. Rien n'est engagé côté soldes
  employé/manager.
- **`DISTRIBUEE`** — le manager a validé l'envoi : sa part créditée + tous les employés
  crédités. **Immuable** ensuite.

(Valeurs d'enum en ASCII pour rester compatibles Prisma et cohérentes avec
`RetributionMode` ; le libellé français accentué est géré à l'affichage.)

L'« ouverture » (le bloc d'interface où le manager compose sa répartition) est une
**simple consultation** : aucun état persisté tant que le manager n'a pas cliqué
« Envoyer ». C'est ce qui rend l'opération sûre — pas d'état intermédiaire bâtard.

## Flux complet

### 1. Création (employeur → enveloppe)

Transaction atomique :
- débite `company.tokenBalance` du **montant total** de l'enveloppe ;
- crée l'`Allocation` en statut `A_DISTRIBUER`.

⚠️ **Changement vs `allocateToManager` actuel** : on ne crédite **plus**
`user.balance` du manager à la création. Les tokens « vivent » dans l'enveloppe
(réservés, suivis par `Allocation.amount`). Le solde perso du manager n'augmente qu'au
moment de l'envoi (de la part R).

### 2. Consultation (manager ouvre le bloc)

Affichage seul. Le backend expose : montant, mode, part manager R calculée à la volée,
budget distribuable = montant − R, et la liste des employés de l'équipe. **Aucune
écriture.**

### 3. Envoi (manager valide la redistribution)

Un **seul** appel backend avec la liste `[{ employeeId, amount, motifId, reason? }]`.
Transaction atomique unique :

1. recharge l'enveloppe ; vérifie `status == À_DISTRIBUER` et qu'elle appartient bien
   au manager appelant ;
2. **recalcule R côté serveur** (jamais de confiance au client) ;
3. vérifie l'invariant **`Σ(amount employés) == montant − R`** (montants entiers) ;
4. `manager.balance += R` (sa part perso, dépensable comme un employé) ;
5. crée toutes les `Attribution` (crédite chaque employé, `motifId` obligatoire),
   rattachées à `allocationId` ;
6. passe l'enveloppe `DISTRIBUÉE` + `distributedAt = now()`.

**En cas d'échec à n'importe quelle étape → rollback total**, l'enveloppe reste
`A_DISTRIBUER`. Garantie : soit l'enveloppe est intégralement traitée (part manager +
redistribution complète), soit rien ne bouge.

## Calculs

### Part manager R, par mode

| Mode | Formule |
|------|---------|
| `PART_EGALE` | `R = floor(montant ÷ (nbEquipe + 1))` |
| `POURCENTAGE` | `R = floor(montant × pourcentage ÷ 100)` |
| `AUCUNE` | `R = 0` |

- **`nbEquipe`** = nombre d'**employés actifs rattachés au manager** dans l'entreprise,
  compté **au moment de l'envoi** (pas seulement les destinataires de cette enveloppe).
  Principe d'équité du mode dynamique : le manager compte comme une part au même titre
  que chaque membre de l'équipe.
- **Budget équipe** = `montant − R` (toujours entier).

### Arrondi

R est arrondi **au plancher** (`floor`). Tout résidu d'arrondi reste donc dans le
budget équipe (en faveur des salariés, cohérent avec l'esprit pot-commun de l'addendum).

Exemples :
- `PART_EGALE`, montant 1200, 5 employés → R = floor(1200 ÷ 6) = **200**, budget 1000.
- `PART_EGALE`, montant 1000, 6 employés → R = floor(1000 ÷ 7) = **142**, budget 858.
- `POURCENTAGE`, montant 1000, 30 % → R = **300**, budget 700.
- `POURCENTAGE`, montant 1050, 33 % → R = floor(346,5) = **346**, budget 704.
- `AUCUNE` → R = 0, budget = montant entier.

### Contraintes de saisie (supportées par le backend)

- Montants employés **entiers strictement positifs** (déjà garanti par Zod `int` +
  CHECK DB).
- Redistribution **complète obligatoire** : l'envoi n'est accepté que si
  `Σ(amount) == montant − R`. (Côté UI : compteur « reste à distribuer » en live,
  bouton « Envoyer » actif uniquement quand le compteur atteint 0.)

## Invariant de conservation

À la création : `pool −montant`.
À l'envoi : `+R` (manager) `+ (montant − R)` (employés) = `montant`.
**Aucun token créé ni perdu.** Le `user.balance` reste défini par le registre
(`SUM(attributionsReceived) − SUM(redemptions)` côté employé ; rétributions cumulées
côté manager).

## Impacts sur le schéma de données

### `Allocation`
- `status AllocationStatus` (`A_DISTRIBUER` | `DISTRIBUEE`) — nouveau.
- `retributionAmount Int @default(0)` — part R fixée à l'envoi (déménage depuis
  `Attribution`).
- `distributedAt DateTime?` — horodatage de l'envoi validé.

### `Attribution`
- `allocationId String? @db.Uuid` + relation vers `Allocation` — rattachement à
  l'enveloppe d'origine. Nullable pour les lignes legacy / distribution directe.
- `retributionAmount` — devient **obsolète** (figé à 0). Conservé pour les lignes
  existantes ; déprécié.

Migration Prisma additive (nouveaux champs nullable / avec défaut) — pas de perte de
données. Cf. mémoire projet : Prisma v5.22 épinglé, synchro DB via `migrate`.

## Endpoints

- **Création enveloppe** (employeur) : adapte la logique de `allocateToManager` — débit
  pool + création `Allocation`, **sans** crédit du solde manager.
- **Consultation enveloppe** (manager) : nouveau, lecture seule (montant, R, budget,
  équipe).
- **Envoi / redistribution** (manager) : nouveau, remplace l'appel unitaire
  `POST /attributions` pour le manager. Reçoit la liste complète, exécute la transaction
  atomique décrite plus haut.
- **Distribution directe employeur → employé** (cas TPE du schéma pyramidal) : reste
  inchangée (débit pool, crédit employé).

## Points de coordination (hors code)

Les **contrats gelés** de `src/contracts/manager.contracts.ts` sont impactés et leur
modification requiert en principe l'accord Dev A / Dev B / Dev C :
- `DistributeResponse.retributionAmount` (par attribution) → la rétribution n'est plus
  par-attribution mais par-enveloppe.
- La réponse d'allocation et la sémantique de `ManagerBalancesResponse.envelopeRemaining`
  (dérivée par enveloppe désormais).
- Le schéma de requête de distribution passe d'un objet unique à une **liste**.

À acter avec l'équipe avant gel des nouvelles shapes.

## Hors périmètre (cette branche)

- UI « Mes enveloppes », bloc de composition, compteur live (front).
- Motifs personnalisés employeur (V2).
- Stats consolidées (déjà couvertes ailleurs).
