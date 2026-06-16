// Entreprise du manager (GET /api/company).
export type Company = {
  id: string;
  name: string;
  tokenBalance: number;
};

// Une ligne d'historique d'attribution (GET /api/attributions).
export type AttributionHistory = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  employee: { firstName: string; lastName: string };
};
