import type { RetributionMode } from '@prisma/client';

// Part de rétribution R du manager, prélevée sur l'enveloppe à l'envoi (addendum v1.1
// §3.4). Arrondi au PLANCHER : tout résidu reste dans le budget équipe (en faveur des
// salariés). Fonction pure et déterministe — testée isolément.
export function computeRetribution(params: {
  mode: RetributionMode;
  amount: number;
  percentage: number | null;
  teamSize: number; // nb d'employés actifs de l'entreprise (le manager est le +1)
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
