import { useCallback, useEffect, useState } from 'react';
import { listAdminAttributions, listAdminRedemptions, listAdminPurchases } from '../services/api';
import type { AdminAttribution, AdminRedemption, AdminPurchase } from '../types/types';

const PAGE_SIZE = 20;
type Ledger = 'attributions' | 'redemptions' | 'purchases';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

export default function AdminLedgers() {
  const [ledger, setLedger] = useState<Ledger>('attributions');
  const [attributions, setAttributions] = useState<AdminAttribution[] | null>(null);
  const [redemptions, setRedemptions] = useState<AdminRedemption[] | null>(null);
  const [purchases, setPurchases] = useState<AdminPurchase[] | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = ledger === 'attributions'
        ? await listAdminAttributions(page, PAGE_SIZE)
        : ledger === 'redemptions'
        ? await listAdminRedemptions(page, PAGE_SIZE)
        : await listAdminPurchases(page, PAGE_SIZE);
      if (res.ok && res.data) {
        if (ledger === 'attributions') setAttributions(res.data.items as AdminAttribution[]);
        else if (ledger === 'redemptions') setRedemptions(res.data.items as AdminRedemption[]);
        else setPurchases(res.data.items as AdminPurchase[]);
        setTotal(res.data.total);
        setHasMore(res.data.hasMore);
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger le registre.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }, [ledger, page]);

  useEffect(() => {
    load();
  }, [load]);

  const switchLedger = (l: Ledger) => {
    setPage(1);
    setLedger(l);
  };

  const rows = ledger === 'attributions' ? attributions : ledger === 'redemptions' ? redemptions : purchases;

  return (
    <div className="admin-ledgers">
      <div className="admin-subtabs">
        <button type="button" className={`admin-tab ${ledger === 'attributions' ? 'active' : ''}`}
          onClick={() => switchLedger('attributions')}>
          Attributions
        </button>
        <button type="button" className={`admin-tab ${ledger === 'redemptions' ? 'active' : ''}`}
          onClick={() => switchLedger('redemptions')}>
          Redemptions
        </button>
        <button type="button" className={`admin-tab ${ledger === 'purchases' ? 'active' : ''}`}
          onClick={() => switchLedger('purchases')}>
          Transactions Stripe
        </button>
      </div>

      {loading && <p className="admin-msg">Chargement…</p>}
      {error && <p className="admin-msg admin-error">{error}</p>}

      {!loading && rows && (
        rows.length === 0 ? (
          <p className="admin-msg">Aucune entrée.</p>
        ) : (
          <>
            <div className="admin-table-scroll">
              {ledger === 'attributions' ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entreprise</th>
                      <th>Manager</th>
                      <th>Employé</th>
                      <th>Montant</th>
                      <th>Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attributions!.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Date">{fmtDate(a.createdAt)}</td>
                        <td data-label="Entreprise">{a.company.name}</td>
                        <td data-label="Manager">{fullName(a.manager)}</td>
                        <td data-label="Employé">{fullName(a.employee)}</td>
                        <td data-label="Montant">{a.amount}</td>
                        <td data-label="Motif">{a.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : ledger === 'redemptions' ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entreprise</th>
                      <th>Employé</th>
                      <th>Offre</th>
                      <th>Code</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions!.map((r) => (
                      <tr key={r.id}>
                        <td data-label="Date">{fmtDate(r.createdAt)}</td>
                        <td data-label="Entreprise">{r.company.name}</td>
                        <td data-label="Employé">{fullName(r.employee)}</td>
                        <td data-label="Offre">{r.offer.partnerName}</td>
                        <td data-label="Code">{r.promoCode.code}</td>
                        <td data-label="Montant">{r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entreprise</th>
                      <th>Crédité par</th>
                      <th>Montant</th>
                      <th>Note</th>
                      <th>Session Stripe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases!.map((p) => (
                      <tr key={p.id}>
                        <td data-label="Date">{fmtDate(p.createdAt)}</td>
                        <td data-label="Entreprise">{p.company.name}</td>
                        <td data-label="Crédité par">{fullName(p.createdBy)}</td>
                        <td data-label="Montant">{p.amount}</td>
                        <td data-label="Note">{p.note ?? '-'}</td>
                        <td data-label="Session Stripe"><code>{p.stripeSessionId}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-pagination">
              <button className="admin-btn-ghost" disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                 Précédent
              </button>
              <span className="admin-page-info">
                Page {page} · {total} entrée{total > 1 ? 's' : ''}
              </span>
              <button className="admin-btn-ghost" disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}>
                Suivant →
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
