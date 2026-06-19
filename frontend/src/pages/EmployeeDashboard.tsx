import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatDate } from '@/lib/format';
import { HEADER_BTN_GHOST } from '@/components/layout/headerButtons';

const WRAPPER = 'min-h-screen bg-[#f4f5f7] px-4 py-6 sm:px-5';
const CONTAINER = 'mx-auto flex w-full max-w-[640px] flex-col';
const SECTION = 'mb-3.5 rounded-xl border border-primo-border bg-primo-bg px-[18px] py-4';
const SECTION_TITLE = 'mb-3 text-[15px] font-bold text-[#1f2937]';
const NOTE = 'm-0 text-center text-[13px] text-primo-gray';
const ERROR_NOTE = 'm-0 text-center text-[13px] text-primo-error';
const MUTED = 'text-sm font-medium text-primo-gray-light';
const CARD = 'rounded-xl border border-primo-border bg-primo-bg px-4 py-4';
const CARD_ICON = 'mb-1.5 text-[22px]';
const CARD_LABEL = 'mb-1 text-[13px] text-primo-gray';
const CARD_VALUE = 'text-[22px] font-bold text-[#1f2937]';
const TX_LIST = 'm-0 flex list-none flex-col gap-2 p-0';
const TX_ROW =
  'flex items-center justify-between gap-3 rounded-[10px] border border-[#ececf1] bg-[#fafafb] px-3 py-2.5';
const TX_MAIN = 'min-w-0';
const TX_REASON =
  'text-sm font-semibold text-[#1f2937] overflow-hidden text-ellipsis whitespace-nowrap';
const TX_SUB = 'text-xs text-primo-gray mt-0.5';
const TX_AMOUNT = 'text-base font-bold flex-shrink-0';
const MORE_BTN =
  'mt-2.5 w-full border border-[#d1d5db] bg-primo-bg text-primo-teal px-3.5 py-[9px] rounded-lg text-sm font-semibold cursor-pointer hover:bg-primo-teal-soft';
const ERROR_RETRY = 'ml-1 cursor-pointer border-0 bg-transparent p-0 font-semibold text-primo-teal hover:text-primo-teal-dark';
const POSITIVE = 'text-primo-success';
const NEGATIVE = 'text-primo-error';
const RECEIVED = 'border-l-[3px] border-l-primo-success';
const SPENT = 'border-l-[3px] border-l-primo-error';

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
          <button className={HEADER_BTN_GHOST} type="button" onClick={onBack}>
            Accueil
          </button>
          <button className={HEADER_BTN_GHOST} type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </>
      }
    >
    <div className={WRAPPER}>
      <div className={CONTAINER}>

        {loading && <p className={NOTE}>Chargement…</p>}

        {!loading && error && (
          <div className={ERROR_NOTE}>
            {error}{' '}
            <button type="button" className={ERROR_RETRY} onClick={reload}>Réessayer</button>
          </div>
        )}

        {!loading && !error && balance !== null && (
          <>
            <div id="nav-solde" className="mb-4 grid grid-cols-1 gap-3 scroll-mt-20">
              <div className={CARD}>
                <div className={CARD_ICON}>🪙</div>
                <div className={CARD_LABEL}>Mon solde</div>
                <div className={CARD_VALUE}>{balance} tokens</div>
              </div>
            </div>

            <section id="nav-recus" className={`${SECTION} scroll-mt-20`}>
              <h2 className={SECTION_TITLE}>Tokens reçus</h2>
              {received.items.length === 0 ? (
                <p className={MUTED}>Aucun token reçu pour l'instant.</p>
              ) : (
                <>
                  <ul className={TX_LIST}>
                    {received.items.map((t) => (
                      <li className={`${TX_ROW} ${RECEIVED}`} key={t.id}>
                        <div className={TX_MAIN}>
                          <div className={TX_REASON}>{t.reason}</div>
                          <div className={TX_SUB}>de {t.managerName} · {formatDate(t.createdAt)}</div>
                        </div>
                        <div className={`${TX_AMOUNT} ${POSITIVE}`}>+{t.amount}</div>
                      </li>
                    ))}
                  </ul>
                  {received.hasMore && (
                    <button className={MORE_BTN} type="button" onClick={received.loadMore}>
                      Voir plus
                    </button>
                  )}
                </>
              )}
            </section>

            <section id="nav-depenses" className={`${SECTION} scroll-mt-20`}>
              <h2 className={SECTION_TITLE}>Mes dépenses</h2>
              {spent.items.length === 0 ? (
                <p className={MUTED}>Aucune dépense pour l'instant.</p>
              ) : (
                <>
                  <ul className={TX_LIST}>
                    {spent.items.map((t) => (
                      <li className={`${TX_ROW} ${SPENT}`} key={t.id}>
                        <div className={TX_MAIN}>
                          <div className={TX_REASON}>{t.offerName}</div>
                          <div className={TX_SUB}>code {t.promoCode} · {formatDate(t.createdAt)}</div>
                        </div>
                        <div className={`${TX_AMOUNT} ${NEGATIVE}`}>−{t.amount}</div>
                      </li>
                    ))}
                  </ul>
                  {spent.hasMore && (
                    <button className={MORE_BTN} type="button" onClick={spent.loadMore}>
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
