import type { AttributionHistory } from '../../types/types';
import { formatDate } from '../../lib/format';

type Props = { attributions: AttributionHistory[] };

// Historique des transactions de l'entreprise (partagé patron/manager).
export default function DashHistory({ attributions }: Props) {
  return (
    <section className="history">
      <h2 className="history-title">Historique des transactions</h2>
      {attributions.length === 0 ? (
        <p className="dash-msg">Aucune transaction pour l'instant.</p>
      ) : (
        <ul className="history-list">
          {attributions.map((a) => (
            <li className="history-row" key={a.id}>
              <span className="history-emp">{a.employee.firstName} {a.employee.lastName}</span>
              <span className="history-reason">{a.reason}</span>
              <span className="history-date">{formatDate(a.createdAt)}</span>
              <span className="history-amount">+{a.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
