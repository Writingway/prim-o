import type { RetributionMode } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import Icon from '../ui/Icon';
import {
  ALLOC_MODE, ALLOC_MODE_OPTIONS, ALLOC_MODE_OPT, ALLOC_MODE_OPT_ACTIVE, ALLOC_MODE_HINT,
  ALLOC_PCT_ROW, ALLOC_PCT_LABEL, ALLOC_PCT_CTRL, ALLOC_PCT_BTN, ALLOC_PCT_VALUE,
} from '../dashboard/dashStyles';

type Props = {
  mode: RetributionMode;
  percentage: string; // kept as a string for the controlled input
  onModeChange: (mode: RetributionMode) => void;
  onPercentageChange: (value: string) => void;
};

const MODES: RetributionMode[] = ['PART_EGALE', 'POURCENTAGE', 'AUCUNE'];

const HINTS: Record<RetributionMode, string> = {
  PART_EGALE: 'Le manager reçoit une part égale (enveloppe ÷ (nb employés + 1)).',
  POURCENTAGE: 'Le manager reçoit un pourcentage fixe de l’enveloppe.',
  AUCUNE: 'Le manager ne reçoit rien : tout va à l’équipe.',
};

// Clamps the typed percentage to [1, 100] and returns it as a controlled-input string.
const clampPct = (n: number) => String(Math.min(100, Math.max(1, n)));

// Retribution mode picker (+ conditional % field) for the employer allocation flow.
export default function ModeSelector({ mode, percentage, onModeChange, onPercentageChange }: Props) {
  const pctNum = Number(percentage) || 0;

  return (
    <div className={ALLOC_MODE}>
      <div className={ALLOC_MODE_OPTIONS} role="tablist">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`${ALLOC_MODE_OPT}${mode === m ? ` ${ALLOC_MODE_OPT_ACTIVE}` : ''}`}
            onClick={() => onModeChange(m)}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <p className={ALLOC_MODE_HINT}>{HINTS[mode]}</p>

      {mode === 'POURCENTAGE' && (
        <div className={ALLOC_PCT_ROW}>
          <span className={ALLOC_PCT_LABEL}>Part reversée au manager</span>
          <div className={ALLOC_PCT_CTRL}>
            <button
              type="button"
              className={ALLOC_PCT_BTN}
              aria-label="Diminuer le pourcentage"
              disabled={pctNum <= 1}
              onClick={() => onPercentageChange(clampPct((pctNum || 1) - 1))}
            >
              <Icon name="minus" size={18} strokeWidth={2.2} />
            </button>
            <span className={ALLOC_PCT_VALUE}>{pctNum || 0}%</span>
            <button
              type="button"
              className={ALLOC_PCT_BTN}
              aria-label="Augmenter le pourcentage"
              disabled={pctNum >= 100}
              onClick={() => onPercentageChange(clampPct((pctNum || 0) + 1))}
            >
              <Icon name="plus" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
