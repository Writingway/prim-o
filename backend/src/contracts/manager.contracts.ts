// ─────────────────────────────────────────────────────────────────────────────
// CONTRATS API — addendum v1.1 (Manager & Rétribution). Shapes GELÉES Day-0.
// Dev A (motifs/stats), Dev B (allocation/rétribution/soldes), Dev C (front)
// codent contre ces interfaces. Toute modif = accord des 3 puis bump ici.
//
// Requests (Zod) : voir src/schemas/attribution.schemas.ts
//   - createAttributionSchema  → distribution manager → employé
//   - allocateSchema           → allocation employeur → manager
// Ce fichier ne décrit que les RÉPONSES + DTOs partagés.
// ─────────────────────────────────────────────────────────────────────────────

export type MotifCategory =
  | 'COMPORTEMENTS_INDIVIDUELS'
  | 'RELATION_CLIENT'
  | 'ESPRIT_COLLECTIF'
  | 'ENGAGEMENT';

export type RetributionMode = 'PART_EGALE' | 'POURCENTAGE' | 'AUCUNE';

// ── Motifs (Dev A) ───────────────────────────────────────────────
// GET /api/motifs — liste officielle groupée par catégorie.
export interface MotifDTO {
  id: string;
  tag: string;
  label: string;
  category: MotifCategory;
  compliment: string; // affiché au salarié à la réception
}
export interface ListMotifsResponse {
  categories: Array<{ category: MotifCategory; motifs: MotifDTO[] }>;
}

// ── Allocation employeur → manager (Dev B) ───────────────────────
// POST /api/attributions/allocate  (body = AllocateInput)
export interface AllocateResponse {
  allocationId: string;
  managerId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  companyTokenBalance: number; // pool employeur restant après débit
}

// ── Envoi groupé d'une enveloppe (Dev B) ─────────────────────────
// POST /api/attributions/distribute — transaction atomique : crédit manager (R) +
// crédit de chaque employé + verrouillage de l'enveloppe (DISTRIBUEE).
export interface DistributeEnvelopeResponse {
  allocationId: string;
  retributionAmount: number; // part créditée au manager (§3.4) ; 0 si AUCUNE
  distributed: number;       // total distribué aux employés (= montant − R)
  lineCount: number;         // nb d'attributions créées
  status: 'DISTRIBUEE';
}

// ── Double solde manager (Dev B) — §3.3 ──────────────────────────
// GET /api/attributions/balances
export interface ManagerBalancesResponse {
  envelopeRemaining: number; // budget non distribué des enveloppes A_DISTRIBUER
  personalBalance: number;   // solde perso reçu = rétribution cumulée (user.balance)
}

// ── "Mes enveloppes" du manager (Dev B) ──────────────────────────
// GET /api/attributions/envelopes
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

// ── "Mes enveloppes envoyées" de l'employeur (Dev B) ─────────────
// GET /api/attributions/sent-envelopes
export interface SentEnvelopeDTO {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  retributionAmount: number;
  managerName: string;          // manager destinataire
  distributedAt: string | null; // ISO
  createdAt: string;            // ISO
}
export interface SentEnvelopesResponse {
  envelopes: SentEnvelopeDTO[];
}

// GET /api/managers/me/history — deux historiques distincts.
export interface ManagerHistoryResponse {
  sent: Array<{
    attributionId: string;
    employeeId: string;
    amount: number;
    motifTag: string;
    retributionAmount: number;
    createdAt: string; // ISO
  }>;
  received: Array<{
    amount: number;
    createdAt: string; // ISO
    sourceAllocationId: string | null;
  }>;
}

// ── Stats employeur (Dev A) — §3.2 / §3.4 ────────────────────────
// GET /api/stats?teamId=&from=&to=  (filtres optionnels)
export interface MotifAggregateRow {
  motifTag: string;
  category: MotifCategory;
  count: number;
  totalTokens: number;
}
export interface EmployeeRankingRow {
  employeeId: string;
  totalTokens: number;
  topMotifTag: string | null;
}
// BUMP v1.2 (Dev A, validé) — classement des meilleurs employés PAR motif
// (« qui est le meilleur dans quoi »). Exposé dans StatsResponse → OWNER uniquement.
export interface MotifLeaderboardRow {
  motifTag: string;
  category: MotifCategory;
  top: Array<{ employeeId: string; tokens: number; count: number }>; // Top 3, trié tokens desc
}
// BUMP v1.3 (Dev A, validé) — angles morts PAR manager + courbe d'évolution dans le temps (§3.5).
export interface ManagerBlindSpotsRow {
  managerId: string;
  tags: string[]; // motifs actifs que CE manager n'a jamais utilisés
}
export interface EvolutionPoint {
  period: string;   // mois "YYYY-MM"
  motifTag: string;
  count: number;
  totalTokens: number;
}
// BUMP v1.4 (Dev A) — l'équité expose AUSSI qui le manager priorise (bénéficiaires triés).
export interface EquityRow {
  managerId: string;
  spread: number; // CV des totaux par employé (0 = équitable)
  recipients: Array<{ employeeId: string; tokens: number; share: number }>; // qui reçoit quoi, trié desc ; share = part 0..1
}
export interface StatsResponse {
  motifAggregate: MotifAggregateRow[];        // répartition par motif/catégorie
  ranking: EmployeeRankingRow[];               // classement collaborateurs
  blindSpots: string[];                        // tags de motifs jamais utilisés (angles morts, entreprise)
  blindSpotsByManager: ManagerBlindSpotsRow[]; // §3.5 — angles morts PAR manager
  equityByManager: EquityRow[];                // équité + bénéficiaires priorisés par manager
  velocityByManager: Array<{ managerId: string; avgDelaySeconds: number | null }>; // allocation → 1ère distribution
  leaderboardByMotif: MotifLeaderboardRow[];   // §3.5 — top employés par motif (OWNER only)
  evolution: EvolutionPoint[];                 // §3.5 — évolution mensuelle par motif (filtrable par employeeId)
}
