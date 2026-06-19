// ─────────────────────────────────────────────────────────────────────────────
// CONTRATS API - addendum v1.1 (Manager & Rétribution). Shapes GELÉES Day-0.
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
// GET /api/motifs - liste officielle groupée par catégorie.
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
  companyTokenBalance: number; // pool employeur restant après débit
}

// ── Distribution manager → employé (Dev B) ───────────────────────
// POST /api/attributions  (body = CreateAttributionInput)
// Transaction atomique : débit enveloppe + crédit employé + crédit rétribution manager.
export interface DistributeResponse {
  attributionId: string;
  employeeId: string;
  amount: number;
  motif: { tag: string; compliment: string }; // compliment montré au salarié
  retributionAmount: number;                   // part créditée au manager (§3.4) ; 0 si AUCUNE
  envelopeRemaining: number;                   // enveloppe manager restante après l'opération
}

// ── Double solde manager (Dev B) - §3.3 ──────────────────────────
// GET /api/managers/me/balances
export interface ManagerBalancesResponse {
  envelopeRemaining: number; // enveloppe à distribuer (dérivée du registre Allocation/Attribution)
  personalBalance: number;   // solde perso reçu = rétribution cumulée (user.balance)
}

// GET /api/managers/me/history - deux historiques distincts.
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

// ── Stats employeur (Dev A) - §3.2 / §3.4 ────────────────────────
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
export interface StatsResponse {
  motifAggregate: MotifAggregateRow[];        // répartition par motif/catégorie
  ranking: EmployeeRankingRow[];               // classement collaborateurs
  blindSpots: string[];                        // tags de motifs jamais utilisés (angles morts)
  equityByManager: Array<{ managerId: string; spread: number }>;            // équité de distribution
  velocityByManager: Array<{ managerId: string; avgDelaySeconds: number | null }>; // allocation → 1ère distribution
}
