import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatDate } from '@/lib/format';

const SECTION = 'bg-primo-bg border border-primo-border rounded-xl px-[18px] py-4 mb-3.5';
const SECTION_TITLE = 'm-0 mb-3 text-[15px] font-bold text-[#1f2937]';
const NOTE = 'text-[13px] text-primo-gray text-center m-0';
const MUTED = 'text-sm font-medium text-primo-gray-light';
const TX_LIST = 'list-none m-0 p-0 flex flex-col gap-2';
const TX_ROW =
  'flex items-center justify-between gap-3 px-3 py-2.5 border border-[#ececf1] rounded-[10px] bg-[#fafafb]';
const TX_MAIN = 'min-w-0';
const TX_REASON =
  'text-sm font-semibold text-[#1f2937] overflow-hidden text-ellipsis whitespace-nowrap';
const TX_SUB = 'text-xs text-primo-gray mt-0.5';
const TX_AMOUNT = 'text-base font-bold flex-shrink-0';
const MORE_BTN =
  'mt-2.5 w-full border border-[#d1d5db] bg-primo-bg text-primo-teal px-3.5 py-[9px] rounded-lg text-sm font-semibold cursor-pointer hover:bg-primo-teal-soft';

type EmployeeDashboardProps = {
  onLogout: () => void;
  onBack: () => void;
};

export default function EmployeeDashboard({ onLogout, onBack }: EmployeeDashboardProps) {
  const { balance, error, loading, reload, received, spent, handleLogout } =
    useEmployeeDashboard(onLogout);

  return (
    <Layout
      title="Mon espace"
      chrome="app"
      bottomNav={
        <BottomNav
          items={[
            { key: 'solde', label: 'Solde', icon: '🪙', targetId: 'nav-solde' },
            { key: 'recus', label: 'Reçus', icon: '🎁', targetId: 'nav-recus' },
            { key: 'depenses', label: 'Dépenses', icon: '🛒', targetId: 'nav-depenses' },
            { key: 'profil', label: 'Profil', icon: '👤', targetId: 'nav-profil' },
          ]}
        />
      }
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>
            Accueil
          </button>
          <button className="app-btn app-btn-ghost" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </>
      }
    >
    <div className="emp-dash-wrapper">
      <div className="emp-dash-container">

        {loading && <p className="emp-dash-note">Chargement…</p>}

        {!loading && error && (
          <div className="emp-dash-note emp-dash-error">
            {error}{' '}
            <button type="button" className="emp-dash-retry" onClick={reload}>Réessayer</button>
          </div>
        )}

        {!loading && !error && balance !== null && (
          <>
            <div id="nav-solde" className="emp-dash-cards scroll-mt-20">
              <div className="emp-dash-card">
                <div className="emp-dash-card-icon">🪙</div>
                <div className="emp-dash-card-label">Mon solde</div>
                <div className="emp-dash-card-value">{balance} tokens</div>
              </div>
            </div>

            <section id="nav-recus" className="emp-dash-section scroll-mt-20">
              <h2 className="emp-dash-section-title">Tokens reçus</h2>
              {received.items.length === 0 ? (
                <p className="emp-dash-muted">Aucun token reçu pour l'instant.</p>
              ) : (
                <>
                  <ul className="emp-tx-list">
                    {received.items.map((t) => (
                      <li className="emp-tx-row received" key={t.id}>
                        <div className="emp-tx-main">
                          <div className="emp-tx-reason">{t.reason}</div>
                          <div className="emp-tx-sub">de {t.managerName} · {formatDate(t.createdAt)}</div>
                        </div>
                        <div className="emp-tx-amount positive">+{t.amount}</div>
                      </li>
                    ))}
                  </ul>
                  {received.hasMore && (
                    <button className="emp-dash-more" type="button" onClick={received.loadMore}>
                      Voir plus
                    </button>
                  )}
                </>
              )}
            </section>

            <section id="nav-depenses" className="emp-dash-section scroll-mt-20">
              <h2 className="emp-dash-section-title">Mes dépenses</h2>
              {spent.items.length === 0 ? (
                <p className="emp-dash-muted">Aucune dépense pour l'instant.</p>
              ) : (
                <>
                  <ul className="emp-tx-list">
                    {spent.items.map((t) => (
                      <li className="emp-tx-row spent" key={t.id}>
                        <div className="emp-tx-main">
                          <div className="emp-tx-reason">{t.offerName}</div>
                          <div className="emp-tx-sub">code {t.promoCode} · {formatDate(t.createdAt)}</div>
                        </div>
                        <div className="emp-tx-amount negative">−{t.amount}</div>
                      </li>
                    ))}
                  </ul>
                  {spent.hasMore && (
                    <button className="emp-dash-more" type="button" onClick={spent.loadMore}>
                      Voir plus
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
        {!loading && <EditProfile />}
        <div id="nav-profil" className="scroll-mt-20" />
        {!loading && <PrivacySection onAccountDeleted={onLogout} />}
      </div>
    </div>
    </Layout>
  );
}
