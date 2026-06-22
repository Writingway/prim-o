import type { SentEnvelope } from '../../types/types';
import { MODE_LABELS } from '../../types/types';

type Props = { envelope: SentEnvelope };

// Tuile d'une enveloppe envoyée par l'employeur (lecture seule).
export default function SentEnvelopeTile({ envelope: e }: Props) {
  const distributed = e.status === 'DISTRIBUEE';
  const modeLabel = e.mode === 'POURCENTAGE' ? `${MODE_LABELS.POURCENTAGE} ${e.percentage}%` : MODE_LABELS[e.mode];

  return (
    <div className={`env-tile${distributed ? ' is-locked' : ''}`}>
      <div className="env-icon">{distributed ? '📨' : '✉️'}</div>
      <div className="env-amount">{e.amount}</div>
      <div className="env-mode">{modeLabel}</div>
      <div className="env-part">→ {e.managerName || 'manager'}</div>
      <div className={distributed ? 'env-state-done' : 'env-mode'}>
        {distributed ? 'Distribuée ✓' : 'À distribuer'}
      </div>
    </div>
  );
}
