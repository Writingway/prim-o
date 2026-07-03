import type { ManagerEnvelope } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import Icon from '../ui/Icon';
import { ENV_TILE, ENV_TILE_LOCKED, ENV_ICON, ENV_ICON_LOCKED, ENV_AMOUNT, ENV_MODE, ENV_PART, ENV_STATE_DONE, EMP_ATTRIB_BTN } from '../dashboard/dashStyles';

type Props = {
  envelope: ManagerEnvelope;
  onOpen: (envelope: ManagerEnvelope) => void;
};

// Tile for a received envelope: open (still to distribute) or locked (already distributed).
export default function EnvelopeTile({ envelope: e, onOpen }: Props) {
  const distributed = e.status === 'DISTRIBUEE';
  const modeLabel = e.mode === 'POURCENTAGE' ? `${MODE_LABELS.POURCENTAGE} ${e.percentage}%` : MODE_LABELS[e.mode];

  return (
    <div className={`${ENV_TILE}${distributed ? ` ${ENV_TILE_LOCKED}` : ''}`}>
      <div className={`${ENV_ICON}${distributed ? ` ${ENV_ICON_LOCKED}` : ''}`}><Icon name="envelope" size={22} /></div>
      <div className={ENV_AMOUNT}>{e.amount}</div>
      <div className={ENV_MODE}>{modeLabel}</div>
      {distributed ? (
        <div className={ENV_STATE_DONE}><Icon name="check" size={14} strokeWidth={2.4} /> Distribuée</div>
      ) : (
        <>
          <div className={ENV_PART}>ma part : {e.retributionAmount}</div>
          <button type="button" className={EMP_ATTRIB_BTN} onClick={() => onOpen(e)}>
            Ouvrir
          </button>
        </>
      )}
    </div>
  );
}
