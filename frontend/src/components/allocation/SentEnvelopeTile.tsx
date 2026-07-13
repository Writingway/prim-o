import type { SentEnvelope } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import Icon from '../ui/Icon';
import { ENV_TILE, ENV_TILE_LOCKED, ENV_ICON, ENV_ICON_LOCKED, ENV_AMOUNT, ENV_MODE, ENV_PART, ENV_STATE_DONE } from '../dashboard/dashStyles';

type Props = { envelope: SentEnvelope };

// Read-only tile for an envelope sent by the employer.
export default function SentEnvelopeTile({ envelope: e }: Props) {
  const distributed = e.status === 'DISTRIBUEE';
  const modeLabel = e.mode === 'POURCENTAGE' ? `${MODE_LABELS.POURCENTAGE} ${e.percentage}%` : MODE_LABELS[e.mode];

  return (
    <div className={`${ENV_TILE}${distributed ? ` ${ENV_TILE_LOCKED}` : ''}`}>
      <div className={`${ENV_ICON}${distributed ? ` ${ENV_ICON_LOCKED}` : ''}`}><Icon name="envelope" size={22} /></div>
      <div className={ENV_AMOUNT}>{e.amount}</div>
      <div className={ENV_MODE}>{modeLabel}</div>
      <div className={ENV_PART}>→ {e.managerName || 'manager'}</div>
      {distributed ? (
        <div className={ENV_STATE_DONE}><Icon name="check" size={14} strokeWidth={2.4} /> Distribuée</div>
      ) : (
        <div className={ENV_MODE}>À distribuer</div>
      )}
    </div>
  );
}
