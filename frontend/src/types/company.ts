// The manager's company (GET /api/company).
export type Company = {
  id: string;
  name: string;
  tokenBalance: number;
};

// One attribution history row (GET /api/attributions).
export type AttributionHistory = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  employee: { firstName: string; lastName: string };
};
