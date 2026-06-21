// Allocation par enveloppes & rétribution manager (addendum v1.1).
// Aligné sur les contrats backend (manager.contracts.ts).

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

// Enveloppe telle que renvoyée par GET /api/attributions/envelopes.
export type ManagerEnvelope = {
  allocationId: string;
  amount: number;
  mode: RetributionMode;
  percentage: number | null;
  status: AllocationStatus;
  retributionAmount: number;   // part R du manager (live si A_DISTRIBUER, figée sinon)
  distributableBudget: number; // montant − R
  distributedAt: string | null;
  createdAt: string;
};

export type ManagerBalances = {
  envelopeRemaining: number;
  personalBalance: number;
};

// Enveloppe envoyée par l'employeur (GET /api/attributions/sent-envelopes).
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

// Une ligne de redistribution (POST /api/attributions/distribute).
export type DistributeLine = { employeeId: string; amount: number; motifId: string };

// Libellés FR pour l'affichage (les valeurs DB sont en ASCII).
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
