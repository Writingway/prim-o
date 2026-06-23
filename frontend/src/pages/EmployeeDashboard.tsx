import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import { NAV_ITEMS } from '@/hooks/useBottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import Icon from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import OfferCatalog from '@/components/offers/OfferCatalog';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatDate } from '@/lib/format';
import { HEADER_BTN_GHOST } from '@/components/layout/headerButtons';

const WRAPPER = 'min-h-screen bg-primo-surface px-4 py-5 sm:px-5';
const CONTAINER = 'mx-auto flex w-full max-w-[640px] flex-col';
const SECTION_TITLE = 'mb-3 text-base font-bold text-primo-ink';
const NOTE = 'm-0 text-center text-[13px] text-primo-slate-soft';
const ERROR_NOTE = 'm-0 rounded-xl bg-primo-error-soft px-4 py-3 text-center text-[13px] text-primo-error';
const MUTED = 'text-sm font-medium text-primo-muted';
const ERROR_RETRY = 'ml-1 cursor-pointer border-0 bg-transparent p-0 font-bold text-primo-error underline';

const TX_ROW = 'flex items-center gap-3 rounded-[13px] border border-primo-line bg-white px-3.5 py-3';
const TX_ICON = 'flex h-9 w-9 flex-none items-center justify-center rounded-[10px]';
const TX_REASON = 'truncate text-sm font-bold text-primo-ink';
const TX_SUB = 'text-xs text-primo-muted';
const TX_AMOUNT = 'flex-none text-base font-extrabold';
const MORE_BTN =
  'mt-3 w-full rounded-xl border border-primo-line bg-white px-3.5 py-2.5 text-sm font-bold text-primo-teal-strong hover:bg-primo-mint';
// Déconnexion rapatriée dans le profil en mobile (header masqué < lg).
const MOBILE_LOGOUT =
  'mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-primo-error-line bg-white px-4 py-3.5 text-[15px] font-bold text-primo-error hover:bg-primo-error-soft lg:hidden';

type EmployeeTab = 'solde' | 'offres' | 'historique' | 'profil';

type EmployeeDashboardProps = {
  onLogout: () => void;
  onBack: () => void; // conservé pour la signature de route (non utilisé : `/` redirige)
};

// Espace employé : un shell unique à onglets-vues (barre du bas fixe, le contenu
// est remplacé par onglet — modèle « app mobile », identique à manager/owner).
export default function EmployeeDashboard({ onLogout }: EmployeeDashboardProps) {
  const { balance, error, loading, reload, received, spent, handleLogout } =
    useEmployeeDashboard(onLogout);
  const [tab, setTab] = useState<EmployeeTab>('solde');

  const loader = <p className={NOTE}>Chargement…</p>;
  const errorNote = (
    <div className={ERROR_NOTE}>
      {error}{' '}
      <button type="button" className={ERROR_RETRY} onClick={reload}>Réessayer</button>
    </div>
  );

  return (
    <Layout
      title="Mon espace"
      chrome="app"
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.employee}
          active={tab}
          onSelect={(it) => setTab(it.key as EmployeeTab)}
        />
      }
      headerActions={
        <button className={HEADER_BTN_GHOST} type="button" onClick={handleLogout}>
          Se déconnecter
        </button>
      }
    >
      <div className={WRAPPER}>
        <div className={CONTAINER}>

          {/* ── Onglet Solde : hero + stats rapides ── */}
          {tab === 'solde' && (
            loading ? loader
            : error ? errorNote
            : balance !== null && (
              <>
                <div className="-mx-4 -mt-5 mb-4 overflow-hidden bg-gradient-to-b from-primo-hero-from to-primo-ink-900 px-5 pb-7 pt-8 text-white sm:-mx-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/12 text-white">
                        <Icon name="user" size={21} />
                      </span>
                      <div>
                        <div className="text-[13px] text-white/65">Bonjour</div>
                        <div className="text-[17px] font-bold leading-tight">Mon espace</div>
                      </div>
                    </div>
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <Icon name="bell" size={21} />
                    </span>
                  </div>

                  <div className="mt-7 text-center">
                    <div className="text-[13px] font-medium text-white/65">Mon solde de jetons</div>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <Coin size={44} />
                      <span className="text-[56px] font-extrabold leading-none tracking-[-0.03em]">{balance}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTab('historique')}
                    className="rounded-2xl border border-primo-line bg-white p-4 text-left transition hover:border-primo-teal-100"
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primo-success-soft text-primo-success">
                      <Icon name="arrow-up" size={17} />
                    </span>
                    <div className="text-[21px] font-extrabold text-primo-ink">{received.items.length}</div>
                    <div className="text-xs text-primo-slate-soft">récompenses reçues</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('offres')}
                    className="rounded-2xl border border-primo-line bg-white p-4 text-left transition hover:border-primo-teal-100"
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-primo-warn-soft text-primo-warn">
                      <Icon name="gift" size={17} />
                    </span>
                    <div className="text-[21px] font-extrabold text-primo-ink">{spent.items.length}</div>
                    <div className="text-xs text-primo-slate-soft">codes échangés</div>
                  </button>
                </div>
              </>
            )
          )}

          {/* ── Onglet Offres : catalogue partagé (charge ses propres données) ── */}
          {tab === 'offres' && (
            <OfferCatalog
              isLoggedIn
              canRedeem
              heading="Offres partenaires"
              onRedeemed={reload}
              onSeeSpending={() => setTab('historique')}
            />
          )}

          {/* ── Onglet Historique : reçus + dépenses ── */}
          {tab === 'historique' && (
            loading ? loader
            : error ? errorNote
            : (
              <>
                <section className="mb-6">
                  <h2 className={SECTION_TITLE}>Jetons reçus</h2>
                  {received.items.length === 0 ? (
                    <p className={MUTED}>Aucun jeton reçu pour l'instant — ça ne saurait tarder.</p>
                  ) : (
                    <>
                      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                        {received.items.map((t) => (
                          <li className={`${TX_ROW} border-l-[3px] border-l-primo-success`} key={t.id}>
                            <span className={`${TX_ICON} bg-primo-success-soft text-primo-success`}>
                              <Icon name="received" size={19} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className={TX_REASON}>{t.reason}</div>
                              <div className={TX_SUB}>de {t.managerName} · {formatDate(t.createdAt)}</div>
                            </div>
                            <div className={`${TX_AMOUNT} text-primo-success`}>+{t.amount}</div>
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

                <section className="mb-6">
                  <h2 className={SECTION_TITLE}>Mes dépenses</h2>
                  {spent.items.length === 0 ? (
                    <p className={MUTED}>Aucune dépense pour l'instant. Le catalogue d'offres t'attend.</p>
                  ) : (
                    <>
                      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                        {spent.items.map((t) => (
                          <li className={`${TX_ROW} border-l-[3px] border-l-primo-error`} key={t.id}>
                            <span className={`${TX_ICON} bg-primo-error-soft text-primo-error`}>
                              <Icon name="card" size={19} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className={TX_REASON}>{t.offerName}</div>
                              <div className={TX_SUB}>code {t.promoCode} · {formatDate(t.createdAt)}</div>
                            </div>
                            <div className={`${TX_AMOUNT} text-primo-error`}>−{t.amount}</div>
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
            )
          )}

          {/* ── Onglet Profil ── */}
          {tab === 'profil' && (
            <>
              <EditProfile />
              <PrivacySection onAccountDeleted={onLogout} />
              <button type="button" className={MOBILE_LOGOUT} onClick={handleLogout}>
                <Icon name="logout" size={19} /> Se déconnecter
              </button>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}
