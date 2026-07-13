import { useCallback, useEffect, useState } from 'react';
import { listAdminAttributions, listAdminRedemptions, listAdminPurchases } from '../services/api';
import type { AdminAttribution, AdminRedemption, AdminPurchase } from '../types/types';
import Coin from '@/components/ui/Coin';
import {
  ADMIN_BTN_GHOST,
  ADMIN_CODE,
  ADMIN_PAGE_INFO,
  ADMIN_PAGINATION,
  ADMIN_TABLE,
  ADMIN_TABLE_SCROLL,
  ADMIN_TH,
  ADMIN_TD,
} from './adminClasses';

const PAGE_SIZE = 20;
type Ledger = 'attributions' | 'redemptions' | 'purchases';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

const TAB_INACTIVE = 'inline-flex rounded-full border border-primo-line bg-primo-bg px-4 py-1.5 text-sm font-semibold transition text-primo-gray hover:bg-primo-surface';
const TAB_ACTIVE = 'inline-flex rounded-full border border-primo-teal bg-primo-teal-soft px-4 py-1.5 text-sm font-semibold transition text-primo-teal-dark';

const SUBTITLE: Record<Ledger, string> = {
  attributions: 'Historique des attributions de tokens par les managers',
  redemptions: 'Historique des échanges de tokens contre des offres',
  purchases: 'Historique des achats de tokens via Stripe',
};

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const switchLedger = (l: Ledger) => {
    setPage(1);
    setLedger(l);
  };

  const rows = ledger === 'attributions' ? attributions : ledger === 'redemptions' ? redemptions : purchases;

  return (
    <div className="rounded-2xl border border-primo-line bg-white p-5 lg:p-6">
      <div className="mb-5">
        <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-primo-ink">Registres</h2>
        <p className="mt-0.5 text-[13px] text-primo-gray">{SUBTITLE[ledger]}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={ledger === 'attributions' ? TAB_ACTIVE : TAB_INACTIVE}
          onClick={() => switchLedger('attributions')}>
          Attributions
        </button>
        <button type="button" className={ledger === 'redemptions' ? TAB_ACTIVE : TAB_INACTIVE}
          onClick={() => switchLedger('redemptions')}>
          Redemptions
        </button>
        <button type="button" className={ledger === 'purchases' ? TAB_ACTIVE : TAB_INACTIVE}
          onClick={() => switchLedger('purchases')}>
          Transactions Stripe
        </button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-primo-gray">Chargement…</p>}
      {error && <p className="py-8 text-center text-sm text-primo-error">{error}</p>}

      {!loading && rows && (
        rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-primo-gray">Aucune entrée.</p>
        ) : (
          <>
            <div className={ADMIN_TABLE_SCROLL}>
              {ledger === 'attributions' ? (
                <table className={ADMIN_TABLE}>
                  <thead>
                    <tr>
                      <th className={ADMIN_TH}>Date</th>
                      <th className={ADMIN_TH}>Entreprise</th>
                      <th className={ADMIN_TH}>Manager</th>
                      <th className={ADMIN_TH}>Employ&eacute;</th>
                      <th className={ADMIN_TH}>Montant</th>
                      <th className={ADMIN_TH}>Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attributions!.map((a) => (
                      <tr key={a.id}>
                        <td className={ADMIN_TD} data-label="Date">{fmtDate(a.createdAt)}</td>
                        <td className={ADMIN_TD} data-label="Entreprise">{a.company.name}</td>
                        <td className={ADMIN_TD} data-label="Manager">{fullName(a.manager)}</td>
                        <td className={ADMIN_TD} data-label="Employ&eacute;">{fullName(a.employee)}</td>
                        <td className={ADMIN_TD} data-label="Montant">
                          <span className="inline-flex items-center gap-1">
                            {a.amount}
                            <Coin size={16} />
                          </span>
                        </td>
                        <td className={ADMIN_TD} data-label="Motif">{a.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : ledger === 'redemptions' ? (
                <table className={ADMIN_TABLE}>
                  <thead>
                    <tr>
                      <th className={ADMIN_TH}>Date</th>
                      <th className={ADMIN_TH}>Entreprise</th>
                      <th className={ADMIN_TH}>Employ&eacute;</th>
                      <th className={ADMIN_TH}>Offre</th>
                      <th className={ADMIN_TH}>Code</th>
                      <th className={ADMIN_TH}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions!.map((r) => (
                      <tr key={r.id}>
                        <td className={ADMIN_TD} data-label="Date">{fmtDate(r.createdAt)}</td>
                        <td className={ADMIN_TD} data-label="Entreprise">{r.company.name}</td>
                        <td className={ADMIN_TD} data-label="Employ&eacute;">{fullName(r.employee)}</td>
                        <td className={ADMIN_TD} data-label="Offre">{r.offer.partnerName}</td>
                        <td className={ADMIN_TD} data-label="Code">{r.promoCode.code}</td>
                        <td className={ADMIN_TD} data-label="Montant">
                          <span className="inline-flex items-center gap-1">
                            {r.amount}
                            <Coin size={16} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className={ADMIN_TABLE}>
                  <thead>
                    <tr>
                      <th className={ADMIN_TH}>Date</th>
                      <th className={ADMIN_TH}>Entreprise</th>
                      <th className={ADMIN_TH}>Cr&eacute;dit&eacute; par</th>
                      <th className={ADMIN_TH}>Montant</th>
                      <th className={ADMIN_TH}>Note</th>
                      <th className={ADMIN_TH}>Session Stripe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases!.map((p) => (
                      <tr key={p.id}>
                        <td className={ADMIN_TD} data-label="Date">{fmtDate(p.createdAt)}</td>
                        <td className={ADMIN_TD} data-label="Entreprise">{p.company.name}</td>
                        <td className={ADMIN_TD} data-label="Cr&eacute;dit&eacute; par">{fullName(p.createdBy)}</td>
                        <td className={ADMIN_TD} data-label="Montant">
                          <span className="inline-flex items-center gap-1">
                            {p.amount}
                            <Coin size={16} />
                          </span>
                        </td>
                        <td className={ADMIN_TD} data-label="Note">{p.note ?? '-'}</td>
                        <td className={ADMIN_TD} data-label="Session Stripe">
                          <code className={`${ADMIN_CODE} text-primo-gray`}>{p.stripeSessionId}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={ADMIN_PAGINATION}>
              <button className={ADMIN_BTN_GHOST} disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Pr&eacute;c&eacute;dent
              </button>
              <span className={ADMIN_PAGE_INFO}>
                Page {page} &middot; {total} entr&eacute;e{total > 1 ? 's' : ''}
              </span>
              <button className={ADMIN_BTN_GHOST} disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}>
                Suivant &rarr;
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
