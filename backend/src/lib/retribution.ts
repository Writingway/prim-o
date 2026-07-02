import type { RetributionMode } from '@prisma/client';

// Manager retribution share R, taken from the envelope at send time (addendum v1.1 §3.4).
// Rounded DOWN: any remainder stays in the team budget, in favor of the employees. Pure,
// deterministic function — tested in isolation.
export function computeRetribution(params: {
  mode: RetributionMode;
  amount: number;
  percentage: number | null;
  teamSize: number; // active employees in the company (the manager is the +1)
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
