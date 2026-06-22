import type { RetributionMode } from '../../types/types';
import { MODE_LABELS } from '../../types/types';

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
    <div className="alloc-mode">
      <div className="alloc-mode-options">
        {MODES.map((m) => (
          <label key={m} className={`alloc-mode-opt${mode === m ? ' is-active' : ''}`}>
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
      <p className="alloc-mode-hint">{HINTS[mode]}</p>
      {mode === 'POURCENTAGE' && (
        <input
          className="alloc-input"
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
