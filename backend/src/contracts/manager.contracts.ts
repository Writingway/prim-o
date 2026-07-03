// API contracts - addendum v1.1 (Manager & Retribution). Shapes FROZEN at Day-0.
// Dev A (motifs/stats), Dev B (allocation/retribution/balances) and Dev C (front) all code
// against these interfaces; any change requires agreement from all three, then a bump here.
// A "motif" is the catalogued recognition reason attached to a token attribution.
//
// Request schemas (Zod) live in src/schemas/attribution.schemas.ts:
//   - createAttributionSchema: manager → employee distribution.
//   - allocateSchema: employer → manager allocation.
// This file only describes RESPONSES and shared DTOs.

export type MotifCategory =
  | 'COMPORTEMENTS_INDIVIDUELS'
  | 'RELATION_CLIENT'
  | 'ESPRIT_COLLECTIF'
  | 'ENGAGEMENT';

export type RetributionMode = 'PART_EGALE' | 'POURCENTAGE' | 'AUCUNE';

// Motifs (Dev A) - GET /api/motifs: the official list, grouped by category.
export interface MotifDTO {
  id: string;
  tag: string;
  label: string;
  category: MotifCategory;
  compliment: string; // shown to the employee on receipt
}
export interface ListMotifsResponse {
  categories: Array<{ category: MotifCategory; motifs: MotifDTO[] }>;
}

// Employer → manager allocation (Dev B) - POST /api/attributions/allocate (body = AllocateInput).
export interface AllocateResponse {
  allocationId: string;
  managerId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  companyTokenBalance: number; // employer pool remaining after the debit
}

// Bulk envelope send (Dev B) - POST /api/attributions/distribute. Atomic transaction: credit
// the manager (R), credit each employee, lock the envelope (DISTRIBUEE).
export interface DistributeEnvelopeResponse {
  allocationId: string;
  retributionAmount: number; // share credited to the manager (§3.4); 0 when mode is AUCUNE
  distributed: number;       // total distributed to employees (= amount − R)
  lineCount: number;         // number of attributions created
  status: 'DISTRIBUEE';
}

// Manager's two balances (Dev B, §3.3) - GET /api/attributions/balances.
export interface ManagerBalancesResponse {
  envelopeRemaining: number; // undistributed budget across A_DISTRIBUER envelopes
  personalBalance: number;   // personal balance received = accumulated retribution (user.balance)
}

// Manager's "my envelopes" view (Dev B) - GET /api/attributions/envelopes.
export interface ManagerEnvelopeDTO {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  retributionAmount: number;    // R (computed live while A_DISTRIBUER, frozen once DISTRIBUEE)
  distributableBudget: number;  // amount − R
  distributedAt: string | null; // ISO
  createdAt: string;            // ISO
}
export interface ManagerEnvelopesResponse {
  envelopes: ManagerEnvelopeDTO[];
}

// Employer's "sent envelopes" view (Dev B) - GET /api/attributions/sent-envelopes.
export interface SentEnvelopeDTO {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: 'A_DISTRIBUER' | 'DISTRIBUEE';
  retributionAmount: number;
  managerName: string;          // recipient manager
  distributedAt: string | null; // ISO
  createdAt: string;            // ISO
}
export interface SentEnvelopesResponse {
  envelopes: SentEnvelopeDTO[];
}

// GET /api/managers/me/history - two distinct histories: sent vs received.
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

// Employer stats (Dev A, §3.2 / §3.4) - GET /api/stats?teamId=&from=&to= (optional filters).
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
// BUMP v1.2 (Dev A, approved) - ranking of top employees PER motif ("who is best at what").
// Exposed in StatsResponse, OWNER only.
export interface MotifLeaderboardRow {
  motifTag: string;
  category: MotifCategory;
  top: Array<{ employeeId: string; tokens: number; count: number }>; // top 3, sorted by tokens desc
}
// BUMP v1.3 (Dev A, approved) - blind spots PER manager plus evolution over time (§3.5).
export interface ManagerBlindSpotsRow {
  managerId: string;
  tags: string[]; // active motifs THIS manager has never used
}
export interface EvolutionPoint {
  period: string;   // month, "YYYY-MM"
  motifTag: string;
  count: number;
  totalTokens: number;
}
// BUMP v1.4 (Dev A) - equity ALSO exposes who the manager favors (sorted recipients).
export interface EquityRow {
  managerId: string;
  spread: number; // coefficient of variation of per-employee totals (0 = perfectly even)
  recipients: Array<{ employeeId: string; tokens: number; share: number }>; // who gets what, sorted desc; share in 0..1
}
export interface StatsResponse {
  motifAggregate: MotifAggregateRow[];        // breakdown by motif/category
  ranking: EmployeeRankingRow[];               // employee ranking
  blindSpots: string[];                        // motif tags never used company-wide (blind spots)
  blindSpotsByManager: ManagerBlindSpotsRow[]; // §3.5 - blind spots per manager
  equityByManager: EquityRow[];                // fairness + favored recipients per manager
  velocityByManager: Array<{ managerId: string; avgDelaySeconds: number | null }>; // allocation → first distribution
  managerNames: Record<string, string>;        // managerId → "First Last" (resolved server-side, includes deleted owner/managers)
  leaderboardByMotif: MotifLeaderboardRow[];   // §3.5 - top employees per motif (OWNER only)
  evolution: EvolutionPoint[];                 // §3.5 - monthly evolution per motif (filterable by employeeId)
}
