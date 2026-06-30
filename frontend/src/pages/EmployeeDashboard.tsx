import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import { NAV_ITEMS } from '@/hooks/useBottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import Icon from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import DashboardHero from '@/components/dashboard/DashboardHero';
import OfferCatalog from '@/components/offers/OfferCatalog';
import MyPromoCodes from '@/components/offers/MyPromoCodes';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatDate, formatDateTime } from '@/lib/format';
import { DASH_CONTAINER } from '@/components/dashboard/dashStyles';

const WRAPPER = 'min-h-screen bg-primo-surface px-4 py-5 sm:px-5';
// Check for duplication of constant inside all the dashboard
// const CONTAINER = 'mx-auto flex w-full max-w-[640px] flex-col lg:max-w-[1120px]';
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

type EmployeeTab = 'offres' | 'codes' | 'historique' | 'profil';

type EmployeeDashboardProps = {
  onLogout: () => void;
  onBack: () => void; // conservé pour la signature de route (non utilisé : `/` redirige)
  firstName?: string | null;
  profilePhoto?: string | null;
};

// Espace employé : un shell unique à onglets-vues (barre du bas fixe, le contenu
// est remplacé par onglet — modèle « app mobile », identique à manager/owner).
export default function EmployeeDashboard({ onLogout, firstName, profilePhoto }: EmployeeDashboardProps) {
  const { balance, error, loading, reload, received, spent, handleLogout } =
    useEmployeeDashboard(onLogout);
  const [tab, setTab] = useState<EmployeeTab>('historique');
  // Avatar du hero, maj en direct quand on l'enregistre dans le profil.
  const [heroPhoto, setHeroPhoto] = useState<string | null>(profilePhoto ?? null);
  const heroInitials = (firstName?.[0] ?? '?').toUpperCase();
  const [histView, setHistView] = useState<'recus' | 'depenses'>('recus');

  const loader = <p className={NOTE}>Chargement…</p>;
  const errorNote = (
    <div className={ERROR_NOTE}>
      {error}{' '}
      <button type="button" className={ERROR_RETRY} onClick={reload}>Réessayer</button>
    </div>
  );

  // Hero solde, partagé par les onglets Offres et Historique.
  const hero =
    balance === null ? null : (
      <DashboardHero
        halos
        eyebrow="Bonjour"
        title={firstName ?? 'Mon espace'}
        photo={heroPhoto}
        initials={heroInitials}
      >
        {/* Solde : carte vitrée discrète, jeton mis en valeur. */}
        <div className="relative mt-6 flex items-end justify-between gap-4 rounded-[20px] bg-white/[0.08] px-4 py-4 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/55">
              Mon solde
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white">{balance}</span>
              <span className="text-[15px] font-semibold text-white/70">jetons</span>
            </div>
          </div>
          <Coin size={56} className="drop-shadow-[0_10px_24px_rgba(232,148,23,0.45)]" />
        </div>
      </DashboardHero>
    );

  return (
    <Layout
      title="Mon espace"
      subtitle={firstName ? `Bonjour, ${firstName}` : 'Espace employé'}
      chrome="console"
      hideConsoleMobileHeader
      nav={{
        items: NAV_ITEMS.employee,
        active: tab,
        onSelect: (it) => setTab(it.key as EmployeeTab),
      }}
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.employee}
          active={tab}
          onSelect={(it) => setTab(it.key as EmployeeTab)}
        />
      }
      sidebarFooter={
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-[10px] bg-white/[.05] px-3 py-2.5">
            <ProfileAvatar photo={heroPhoto} initials={heroInitials} size={34} />
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-bold text-[#D4EEEB]">{firstName ?? 'Mon compte'}</div>
              <div className="text-[11px] text-[#3D7A74]">Employé</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold text-[#6BA8A2] transition hover:bg-white/5 hover:text-primo-error"
          >
            <Icon name="logout" size={16} strokeWidth={1.8} /> Se déconnecter
          </button>
        </div>
      }
    >
      <div className={WRAPPER}>
        <div className={DASH_CONTAINER}>  

          {/* ── Onglet Offres : solde + catalogue. Le catalogue n'est PAS derrière
              le `loading` du dashboard : il gère son propre chargement. Sinon, à
              l'achat, `onRedeemed` rerend en loading → OfferCatalog se démonte et
              la célébration « Code débloqué » disparaît avant de s'afficher. ── */}
          {tab === 'offres' && (
            <OfferCatalog
              isLoggedIn
              canRedeem
              heading="Offres partenaires"
              onRedeemed={reload}
              onSeeSpending={() => setTab('codes')}
              largeDesktopCards
            />
          )}

          {/* ── Onglet Mes codes : codes promo achetés (copiables) ── */}
          {tab === 'codes' && <MyPromoCodes />}

          {/* ── Onglet Historique : reçus + dépenses ── */}
          {tab === 'historique' && (
            loading ? loader
            : error ? errorNote
            : (
              <>
                {hero}

                {/* Switch Tokens reçus / Mes dépenses */}
                <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-primo-mint p-1">
                  <button
                    type="button"
                    onClick={() => setHistView('recus')}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition ${
                      histView === 'recus' ? 'bg-white text-primo-success shadow-sm' : 'text-primo-slate'
                    }`}
                  >
                    Tokens reçus
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistView('depenses')}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition ${
                      histView === 'depenses' ? 'bg-white text-primo-error shadow-sm' : 'text-primo-slate'
                    }`}
                  >
                    Mes dépenses
                  </button>
                </div>

                {histView === 'recus' && (
                  <section className="mb-6">
                    {received.items.length === 0 ? (
                      <p className={MUTED}>Aucun jeton reçu pour l'instant — ça ne saurait tarder.</p>
                    ) : (
                      <>
                        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 lg:grid lg:grid-cols-2 lg:items-start lg:gap-2.5">
                          {received.items.map((t) => (
                            <li className={`${TX_ROW} border-l-[3px] border-l-primo-success`} key={t.id}>
                              <ProfileAvatar
                                photo={t.managerPhoto}
                                initials={t.managerName.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                                size={36}
                              />
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
                )}

                {histView === 'depenses' && (
                  <section className="mb-6">
                    {spent.items.length === 0 ? (
                      <p className={MUTED}>Aucune dépense pour l'instant. Le catalogue d'offres t'attend.</p>
                    ) : (
                      <>
                        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 lg:grid lg:grid-cols-2 lg:items-start lg:gap-2.5">
                          {spent.items.map((t) => (
                            <li className={`${TX_ROW} border-l-[3px] border-l-primo-error`} key={t.id}>
                              <span className={`${TX_ICON} bg-primo-error-soft text-primo-error`}>
                                <Icon name="card" size={19} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className={TX_REASON}>{t.offerName}</div>
                                <div className={TX_SUB}>{formatDateTime(t.createdAt)}</div>
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
                )}
              </>
            )
          )}

          {/* ── Onglet Profil ── */}
          {tab === 'profil' && (
            <>
              <EditProfile onPhotoChange={setHeroPhoto} />
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
