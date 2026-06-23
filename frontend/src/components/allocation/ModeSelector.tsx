import type { RetributionMode } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import { ALLOC_MODE, ALLOC_MODE_OPTIONS, ALLOC_MODE_OPT, ALLOC_MODE_OPT_ACTIVE, ALLOC_MODE_HINT, ALLOC_INPUT } from '../dashboard/dashStyles';

type Props = {
  mode: RetributionMode;
  percentage: string; // string pour la saisie contrôlée
  onModeChange: (mode: RetributionMode) => void;
  onPercentageChange: (value: string) => void;
};

const MODES: RetributionMode[] = ['PART_EGALE', 'POURCENTAGE', 'AUCUNE'];

const HINTS: Record<RetributionMode, string> = {
  PART_EGALE: 'Le manager reçoit une part égale (enveloppe ÷ (nb employés + 1)).',
  POURCENTAGE: 'Le manager reçoit un pourcentage fixe de l’enveloppe.',
  AUCUNE: 'Le manager ne reçoit rien : tout va à l’équipe.',
};

// Choix du mode de rétribution (+ champ % conditionnel) pour l'allocation employeur.
export default function ModeSelector({ mode, percentage, onModeChange, onPercentageChange }: Props) {
  return (
    <div className={ALLOC_MODE}>
      <div className={ALLOC_MODE_OPTIONS}>
        {MODES.map((m) => (
          <label key={m} className={`${ALLOC_MODE_OPT}${mode === m ? ` ${ALLOC_MODE_OPT_ACTIVE}` : ''}`}>
            <input
              type="radio"
              name="alloc-mode"
              checked={mode === m}
              onChange={() => onModeChange(m)}
            />
            {MODE_LABELS[m]}
          </label>
        ))}
      </div>
      <p className={ALLOC_MODE_HINT}>{HINTS[mode]}</p>
      {mode === 'POURCENTAGE' && (
        <input
          className={`${ALLOC_INPUT} w-[120px]`}
          type="number"
          min="1"
          max="100"
          step="1"
          placeholder="% (1–100)"
          value={percentage}
          onChange={(e) => onPercentageChange(e.target.value.replace(/[^0-9]/g, ''))}
        />
      )}
    </div>
  );
}
