// Employee as returned by GET /api/employees/list.
export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  balance: number;
  isEmailVerified: boolean;
  createdAt: string;
};

// A received token (manager attribution), returned by GET /api/employees/me/received.
export type ReceivedToken = {
  id: string;
  amount: number;
  reason: string;
  // §3.5 - message shown to the employee on receipt; null for legacy attributions.
  compliment: string | null;
  motifLabel: string | null;
  createdAt: string;
  managerName: string;
  // Sender's avatar (manager/owner); null means fall back to initials.
  managerPhoto: string | null;
};

// A spent token (redemption against an offer), GET /api/employees/me/spent.
export type SpentToken = {
  id: string;
  amount: number;
  offerName: string;
  promoCode: string;
  used: boolean;
  createdAt: string;
};
