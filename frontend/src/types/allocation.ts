// Envelope-based allocation and manager retribution (addendum v1.1). A "motif" is the allocation
// reason a manager picks when distributing tokens. Mirrors the backend contracts in
// manager.contracts.ts.

export type RetributionMode = 'PART_EGALE' | 'POURCENTAGE' | 'AUCUNE';
export type AllocationStatus = 'A_DISTRIBUER' | 'DISTRIBUEE';

export type MotifCategory =
  | 'COMPORTEMENTS_INDIVIDUELS'
  | 'RELATION_CLIENT'
  | 'ESPRIT_COLLECTIF'
  | 'ENGAGEMENT';

export type MotifDTO = {
  id: string;
  tag: string;
  label: string;
  category: MotifCategory;
  compliment: string;
};

export type MotifCategoryGroup = { category: MotifCategory; motifs: MotifDTO[] };

// Envelope as returned by GET /api/attributions/envelopes.
export type ManagerEnvelope = {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: AllocationStatus;
  // Manager's retribution share R: computed live while A_DISTRIBUER, frozen once distributed.
  retributionAmount: number;
  // amount − retributionAmount.
  distributableBudget: number;
  distributedAt: string | null;
  createdAt: string;
};

export type ManagerBalances = {
  envelopeRemaining: number;
  personalBalance: number;
};

// Envelope sent by the employer (GET /api/attributions/sent-envelopes).
export type SentEnvelope = {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: AllocationStatus;
  retributionAmount: number;
  managerName: string;
  distributedAt: string | null;
  createdAt: string;
};

// One redistribution line (POST /api/attributions/distribute).
export type DistributeLine = { employeeId: string; amount: number; motifId: string };

// French display labels (the DB enum values are plain ASCII).
export const MODE_LABELS: Record<RetributionMode, string> = {
  PART_EGALE: 'Part égale',
  POURCENTAGE: 'Pourcentage',
  AUCUNE: 'Aucune',
};

export const MOTIF_CATEGORY_LABELS: Record<MotifCategory, string> = {
  COMPORTEMENTS_INDIVIDUELS: 'Comportements individuels',
  RELATION_CLIENT: 'Relation client',
  ESPRIT_COLLECTIF: 'Esprit collectif',
  ENGAGEMENT: 'Engagement',
};
