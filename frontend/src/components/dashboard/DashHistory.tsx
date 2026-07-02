import type { AttributionHistory } from '../../types/types';
import { formatDate } from '../../lib/format';
import { HISTORY, HISTORY_TITLE, DASH_MSG, HISTORY_LIST, HISTORY_ROW, HISTORY_EMP, HISTORY_REASON, HISTORY_DATE, HISTORY_AMOUNT } from './dashStyles';

type Props = { attributions: AttributionHistory[] };

// Company transaction history, shared by the owner and manager dashboards.
export default function DashHistory({ attributions }: Props) {
  return (
    <section className={HISTORY}>
      <h2 className={HISTORY_TITLE}>Historique des transactions</h2>
      {attributions.length === 0 ? (
        <p className={DASH_MSG}>Aucune transaction pour l'instant.</p>
      ) : (
        <ul className={HISTORY_LIST}>
          {attributions.map((a) => (
            <li className={HISTORY_ROW} key={a.id}>
              <span className={HISTORY_EMP}>{a.employee.firstName} {a.employee.lastName}</span>
              <span className={HISTORY_REASON}>{a.reason}</span>
              <span className={HISTORY_DATE}>{formatDate(a.createdAt)}</span>
              <span className={HISTORY_AMOUNT}>+{a.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
