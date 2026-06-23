import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import { NAV_ITEMS } from '@/hooks/useBottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import Icon from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import HeroThemeButton from '@/components/dashboard/HeroThemeButton';
import HeroLogo from '@/components/dashboard/HeroLogo';
import OfferCatalog from '@/components/offers/OfferCatalog';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { useHeroTheme } from '@/hooks/useHeroTheme';
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

type EmployeeTab = 'offres' | 'historique' | 'profil';

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
  const [tab, setTab] = useState<EmployeeTab>('offres');
  // Avatar du hero, maj en direct quand on l'enregistre dans le profil.
  const [heroPhoto, setHeroPhoto] = useState<string | null>(profilePhoto ?? null);
  const heroInitials = (firstName?.[0] ?? '?').toUpperCase();
  const { theme, setTheme, gradient } = useHeroTheme();

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

          {/* ── Onglet Offres : solde compact + catalogue mis en avant ── */}
          {tab === 'offres' && (
            loading ? loader
            : error ? errorNote
            : balance !== null && (
              <>
                {/* Hero compact : solde en tête, puis on pousse vers les offres.
                    Plein cadre (flush), profondeur via halos teal + filigrane pièce. */}
                <div className={`relative -mx-4 -mt-5 mb-6 overflow-hidden bg-gradient-to-br ${gradient} px-5 pb-7 pt-7 text-white sm:-mx-5`}>
                  {/* Halos lumineux : matière sur le dégradé, sans gadget. */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primo-teal/30 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primo-gold/10 blur-3xl" />

                  {/* Logo centré en haut */}
                  <HeroLogo className="relative mb-5" />

                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar photo={heroPhoto} initials={heroInitials} size={40} className="ring-1 ring-white/15" />
                      <div>
                        <div className="text-[12px] uppercase tracking-[0.12em] text-white/55">Bonjour</div>
                        <div className="text-[17px] font-bold leading-tight">{firstName ?? 'Mon espace'}</div>
                      </div>
                    </div>
                    <HeroThemeButton theme={theme} onChange={setTheme} />
                  </div>

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
                </div>

                {/* Catalogue : mis en avant dès l'arrivée sur l'espace */}
                <OfferCatalog
                  isLoggedIn
                  canRedeem
                  heading="Offres partenaires"
                  onRedeemed={reload}
                  onSeeSpending={() => setTab('historique')}
                />
              </>
            )
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
