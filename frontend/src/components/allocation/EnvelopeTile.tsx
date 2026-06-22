import type { ManagerEnvelope } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import Icon from '../ui/Icon';

type Props = {
  envelope: ManagerEnvelope;
  onOpen: (envelope: ManagerEnvelope) => void;
};

// Tuile d'une enveloppe reçue : ouverte (à distribuer) ou verrouillée (distribuée).
export default function EnvelopeTile({ envelope: e, onOpen }: Props) {
  const distributed = e.status === 'DISTRIBUEE';
  const modeLabel = e.mode === 'POURCENTAGE' ? `${MODE_LABELS.POURCENTAGE} ${e.percentage}%` : MODE_LABELS[e.mode];

  return (
    <div className={`env-tile${distributed ? ' is-locked' : ''}`}>
      <div className="env-icon"><Icon name="envelope" size={22} /></div>
      <div className="env-amount">{e.amount}</div>
      <div className="env-mode">{modeLabel}</div>
      {distributed ? (
        <div className="env-state env-state-done"><Icon name="check" size={14} strokeWidth={2.4} /> Distribuée</div>
      ) : (
        <>
          <div className="env-part">ma part : {e.retributionAmount}</div>
          <button type="button" className="emp-attrib-btn" onClick={() => onOpen(e)}>
            Ouvrir
          </button>
        </>
      )}
    </div>
  );
}
