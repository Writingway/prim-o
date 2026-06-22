import type { SentEnvelope } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import Icon from '../ui/Icon';

type Props = { envelope: SentEnvelope };

// Tuile d'une enveloppe envoyée par l'employeur (lecture seule).
export default function SentEnvelopeTile({ envelope: e }: Props) {
  const distributed = e.status === 'DISTRIBUEE';
  const modeLabel = e.mode === 'POURCENTAGE' ? `${MODE_LABELS.POURCENTAGE} ${e.percentage}%` : MODE_LABELS[e.mode];

  return (
    <div className={`env-tile${distributed ? ' is-locked' : ''}`}>
      <div className="env-icon"><Icon name="envelope" size={22} /></div>
      <div className="env-amount">{e.amount}</div>
      <div className="env-mode">{modeLabel}</div>
      <div className="env-part">→ {e.managerName || 'manager'}</div>
      {distributed ? (
        <div className="env-state-done"><Icon name="check" size={14} strokeWidth={2.4} /> Distribuée</div>
      ) : (
        <div className="env-mode">À distribuer</div>
      )}
    </div>
  );
}
