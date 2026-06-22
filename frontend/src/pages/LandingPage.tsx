import { useEffect, useMemo, useState } from 'react';
import { listOffers, redeemOffer } from '../services/api';
import type { Offer, Role } from '../types/types';
import Layout from '../components/layout/Layout';
import BottomNav from '../components/layout/BottomNav';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import Coin from '../components/ui/Coin';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { HEADER_BTN_PRIMARY, HEADER_BTN_GHOST } from '../components/layout/headerButtons';

// Charte « réimaginée » : teal + or, icônes linéaires (zéro emoji). Cf. README C1/C2/C3.
const CTA_PRIMARY =
  'w-full rounded-2xl border-0 bg-primo-teal px-4 py-4 text-base font-bold text-white shadow-[0_12px_26px_-8px_rgba(0,161,154,0.6)] transition hover:bg-primo-teal-strong disabled:opacity-60';
const CTA_OUTLINE_LIGHT =
  'w-full rounded-2xl border-[1.5px] border-white/25 bg-white/[0.06] px-4 py-3.5 text-base font-bold text-white transition hover:bg-white/10';

const categoryMeta: Record<Offer['category'], { icon: IconName; tile: string; label: string }> = {
  FOOD: { icon: 'coffee', tile: 'bg-primo-cat-food-soft text-primo-cat-food', label: 'Restauration' },
  SHOPPING: { icon: 'gift', tile: 'bg-primo-cat-shop-soft text-primo-cat-shop', label: 'Shopping' },
  CULTURE: { icon: 'ticket', tile: 'bg-primo-cat-culture-soft text-primo-cat-culture', label: 'Culture' },
  TRAVEL: { icon: 'plane', tile: 'bg-primo-cat-travel-soft text-primo-cat-travel', label: 'Voyage' },
  WELLNESS: { icon: 'heart', tile: 'bg-primo-cat-wellness-soft text-primo-cat-wellness', label: 'Bien-être' },
  OTHER: { icon: 'gift', tile: 'bg-primo-mint text-primo-teal-strong', label: 'Autre' },
};

type LandingPageProps = {
  isLoggedIn: boolean;
  role?: Role;
  onLogin: () => void;
  onRegister: () => void;
  onDashboard: () => void;
  onLogout: () => void;
};

type Revealed = { code: string; offerName: string; amount: number };

// Page d'accueil / hub : hero splash + catalogue d'offres partenaires (Phase 2 + 3).
export default function LandingPage({
  isLoggedIn,
  role,
  onLogin,
  onRegister,
  onDashboard,
  onLogout,
}: LandingPageProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres catalogue (C1).
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<Offer['category'] | 'ALL'>('ALL');

  // Détail d'offre + achat.
  const [selected, setSelected] = useState<Offer | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [copied, setCopied] = useState(false);

  // Achat réservé aux employés ET managers (le manager dépense sa rétribution).
  const canRedeem = isLoggedIn && (role === 'employee' || role === 'manager');

  useEffect(() => {
    let alive = true;
    listOffers()
      .then((res) => {
        if (alive && res.ok && res.data) setOffers(res.data.offers);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Catégories réellement présentes, pour n'afficher que les chips utiles.
  const presentCats = useMemo(() => {
    const set = new Set<Offer['category']>();
    offers.forEach((o) => set.add(o.category));
    return (['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'] as const).filter((c) =>
      set.has(c),
    );
  }, [offers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter(
      (o) =>
        (activeCat === 'ALL' || o.category === activeCat) &&
        (q === '' || o.partnerName.toLowerCase().includes(q)),
    );
  }, [offers, query, activeCat]);

  const openDetail = (offer: Offer) => {
    setRedeemError('');
    setSelected(offer);
  };

  const handleRedeem = async (offer: Offer) => {
    setRedeemError('');
    const ok = await confirm({
      title: `Échanger ${offer.cost} jetons ?`,
      message: `Obtenir un code « ${offer.partnerName} » en échange de ${offer.cost} jetons ?`,
      confirmLabel: 'Échanger',
    });
    if (!ok) return;

    setRedeeming(true);
    try {
      const res = await redeemOffer(offer.id);
      if (res.ok && res.data) {
        setSelected(null);
        setCopied(false);
        setRevealed(res.data);
      } else if (res.status === 401) {
        setRedeemError('Session expirée, reconnecte-toi.');
      } else if (res.data && typeof res.data === 'object' && 'error' in res.data) {
        setRedeemError(String((res.data as { error: string }).error));
      } else {
        setRedeemError("Impossible d'échanger pour le moment.");
      }
    } catch {
      setRedeemError('Impossible de joindre le serveur.');
    } finally {
      setRedeeming(false);
    }
  };

  const copyCode = () => {
    if (!revealed) return;
    navigator.clipboard?.writeText(revealed.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMeta = selected ? (categoryMeta[selected.category] ?? categoryMeta.OTHER) : null;

  return (
    <Layout
      bottomNav={
        isLoggedIn ? (
          <BottomNav
            items={[
              { key: 'offres', label: 'Offres', icon: 'gift', targetId: '' },
              { key: 'espace', label: 'Mon espace', icon: 'home', targetId: '' },
            ]}
            active="offres"
            onSelect={(it) => {
              if (it.key === 'espace') onDashboard();
            }}
          />
        ) : undefined
      }
      headerActions={
        isLoggedIn ? (
          <>
            <button className={HEADER_BTN_PRIMARY} type="button" onClick={onDashboard}>
              Mon tableau de bord
            </button>
            <button className={HEADER_BTN_GHOST} type="button" onClick={onLogout}>
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <button className={HEADER_BTN_GHOST} type="button" onClick={onLogin}>
              Se connecter
            </button>
            <button className={HEADER_BTN_PRIMARY} type="button" onClick={onRegister}>
              S'inscrire
            </button>
          </>
        )
      }
    >
      <div className="min-h-screen bg-primo-surface">
        {/* HERO / splash */}
        <section className="bg-gradient-to-b from-primo-hero-from to-primo-ink-900 text-white">
          <div className="mx-auto flex max-w-[640px] flex-col items-center px-6 pb-12 pt-12 text-center lg:max-w-[840px] lg:pb-16 lg:pt-16">
            <Coin size={92} float />
            <h1 className="mt-8 text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
              Tes efforts récompensés{' '}
              <span className="text-primo-gold-bright">instantanément</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[460px] text-[17px] font-medium text-white/70">
              Échange tes jetons contre des offres exclusives chez nos partenaires.
            </p>
            {!isLoggedIn && (
              <div className="mt-9 flex w-full max-w-[320px] flex-col gap-3">
                <button className={CTA_PRIMARY} type="button" onClick={onRegister}>
                  Créer mon compte
                </button>
                <button className={CTA_OUTLINE_LIGHT} type="button" onClick={onLogin}>
                  J'ai déjà un compte
                </button>
              </div>
            )}
          </div>
        </section>

        {/* CATALOGUE */}
        <section className="mx-auto max-w-[1000px] px-5 pb-24 pt-8 lg:pb-16">
          <h2 className="text-[25px] font-extrabold tracking-[-0.02em] text-primo-ink">
            Offres partenaires
          </h2>

          {/* Recherche */}
          <div className="mt-3 flex items-center gap-2.5 rounded-[13px] border-[1.5px] border-primo-line bg-white px-3.5 py-2.5">
            <Icon name="search" size={19} className="flex-none text-primo-muted" />
            <input
              className="w-full border-0 bg-transparent text-sm text-primo-ink placeholder:text-primo-muted focus:outline-none"
              type="search"
              placeholder="Rechercher une enseigne…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Chips de catégorie */}
          {presentCats.length > 0 && (
            <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1">
              <Chip active={activeCat === 'ALL'} onClick={() => setActiveCat('ALL')}>
                Tout
              </Chip>
              {presentCats.map((c) => (
                <Chip key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>
                  {categoryMeta[c].label}
                </Chip>
              ))}
            </div>
          )}

          {/* Grille */}
          {loading ? (
            <p className="mt-8 text-center text-sm font-medium text-primo-muted">Chargement des offres…</p>
          ) : filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm font-medium text-primo-muted">
              {offers.length === 0
                ? 'Aucune offre disponible pour le moment.'
                : 'Aucune offre ne correspond à ta recherche.'}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {filtered.map((o) => {
                const meta = categoryMeta[o.category] ?? categoryMeta.OTHER;
                return (
                  <article
                    className="relative cursor-pointer rounded-[18px] border border-primo-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                    key={o.id}
                    onClick={() => openDetail(o)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openDetail(o);
                    }}
                  >
                    {o.discountPercent > 0 && (
                      <span className="absolute right-3 top-3 rounded-[14px] bg-primo-warn px-2 py-[3px] text-[11px] font-extrabold text-white">
                        −{o.discountPercent}%
                      </span>
                    )}
                    <span
                      className={`mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-[13px] ${meta.tile}`}
                    >
                      <Icon name={meta.icon} size={24} />
                    </span>
                    <h3 className="text-[15px] font-bold text-primo-ink">{o.partnerName}</h3>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.04em] text-primo-muted">
                      {meta.label}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <Coin size={17} />
                      <span className="text-sm font-extrabold text-primo-teal-strong">{o.cost}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Détail d'une offre — bottom sheet (C2) */}
      {selected && selectedMeta && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex w-full max-w-[440px] animate-sheet-up flex-col items-center rounded-t-[32px] bg-primo-surface px-6 pb-10 pt-2.5 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 h-[5px] w-11 rounded-full bg-[#d6e0de]" />
            <span
              className={`flex h-[84px] w-[84px] items-center justify-center rounded-[24px] ${selectedMeta.tile}`}
            >
              <Icon name={selectedMeta.icon} size={44} strokeWidth={1.7} />
            </span>
            <h3 className="mt-[18px] text-[26px] font-extrabold tracking-[-0.02em] text-primo-ink">
              {selected.partnerName}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-[20px] bg-primo-mint px-3 py-[5px] text-xs font-semibold text-primo-teal-strong">
                {selectedMeta.label}
              </span>
              {selected.discountPercent > 0 && (
                <span className="rounded-[20px] bg-primo-warn px-3 py-[5px] text-xs font-bold text-white">
                  −{selected.discountPercent}%
                </span>
              )}
            </div>

            {selected.available ? (
              <div className="mt-[18px] flex items-center gap-1.5 rounded-[20px] bg-primo-success-soft px-3.5 py-2 text-[13px] font-bold text-primo-success">
                <Icon name="check" size={16} strokeWidth={2.2} />
                Disponible immédiatement
              </div>
            ) : (
              <div className="mt-[18px] flex items-center gap-1.5 rounded-[20px] bg-primo-error-soft px-3.5 py-2 text-[13px] font-bold text-primo-error">
                <Icon name="alert" size={16} strokeWidth={2} />
                Offre épuisée
              </div>
            )}

            <div className="mt-6 w-full border-t border-dashed border-[#d6e0de]" />

            <div className="mt-5 flex w-full items-center justify-between">
              <div>
                <div className="text-[13px] text-primo-slate-soft">Coût</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Coin size={30} />
                  <span className="text-[30px] font-extrabold tracking-[-0.02em] text-primo-ink">
                    {selected.cost}
                  </span>
                </div>
              </div>
            </div>

            {redeemError && (
              <p className="mt-4 w-full rounded-xl bg-primo-error-soft px-4 py-3 text-center text-[13px] text-primo-error">
                {redeemError}
              </p>
            )}

            {canRedeem ? (
              <button
                className={`${CTA_PRIMARY} mt-[22px]`}
                type="button"
                disabled={!selected.available || redeeming}
                onClick={() => handleRedeem(selected)}
              >
                {redeeming ? '…' : `Échanger ${selected.cost} jetons`}
              </button>
            ) : (
              <p className="mt-[22px] text-center text-[13px] text-primo-muted">
                {isLoggedIn
                  ? 'Échange réservé aux employés et aux managers.'
                  : "Connecte-toi en tant qu'employé ou manager pour obtenir un code."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Révélation du code obtenu — célébration (C3) */}
      {revealed && (
        <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden bg-gradient-to-b from-primo-hero-from via-primo-ink-900 to-primo-ink-950 text-white">
          {/* Confettis statiques */}
          <span className="pointer-events-none absolute left-[12%] top-[14%] h-[9px] w-[9px] rotate-[20deg] rounded-[2px] bg-primo-gold-bright" />
          <span className="pointer-events-none absolute right-[16%] top-[18%] h-2 w-2 rounded-full bg-primo-teal-100" />
          <span className="pointer-events-none absolute left-[18%] top-[26%] h-3.5 w-[7px] -rotate-[25deg] rounded-[3px] bg-primo-cat-food" />
          <span className="pointer-events-none absolute left-[40%] top-[15%] h-1.5 w-1.5 rounded-full bg-white" />
          <span className="pointer-events-none absolute right-[14%] top-[30%] h-2.5 w-2.5 rotate-[40deg] rounded-[2px] bg-primo-gold-bright" />
          <span className="pointer-events-none absolute left-[14%] top-[36%] h-2 w-2 rounded-full bg-primo-teal-100" />

          <div className="flex justify-end p-6">
            <button
              type="button"
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
              onClick={() => setRevealed(null)}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span
              className="primo-coin flex items-center justify-center rounded-full text-primo-ink-900 animate-primo-float"
              style={{
                width: 118,
                height: 118,
                boxShadow:
                  'inset 0 -8px 14px rgba(150,90,0,.45), inset 0 8px 12px rgba(255,255,255,.6), 0 24px 50px -10px rgba(232,148,23,.6)',
              }}
              aria-hidden
            >
              <Icon name="check" size={56} strokeWidth={2.6} />
            </span>
            <div className="mt-7 text-[28px] font-extrabold tracking-[-0.02em]">Code débloqué !</div>
            <p className="mt-2.5 text-[15px] text-white/70">
              {revealed.amount} jetons débités · {revealed.offerName}
            </p>

            <div className="mt-8 w-full max-w-[320px] rounded-[18px] border-[1.5px] border-dashed border-primo-gold-bright/50 bg-white/[0.07] px-5 py-5">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-white/55">
                Ton code promo
              </div>
              <div className="mt-2.5 break-all font-mono text-[30px] font-extrabold tracking-[3px] text-primo-gold-bright">
                {revealed.code}
              </div>
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="mt-[18px] flex w-full max-w-[320px] items-center justify-center gap-2.5 rounded-[15px] border-0 bg-white px-4 py-4 text-base font-bold text-primo-teal-strong"
            >
              <Icon name={copied ? 'check' : 'copy'} size={19} strokeWidth={copied ? 2.4 : 1.8} />
              {copied ? 'Copié' : 'Copier le code'}
            </button>
          </div>

          <div className="px-8 pb-11">
            <button
              type="button"
              onClick={() => {
                setRevealed(null);
                if (isLoggedIn) onDashboard();
              }}
              className="mx-auto block w-full max-w-[320px] rounded-[15px] border-[1.5px] border-white/25 bg-transparent px-4 py-3.5 text-base font-bold text-white hover:bg-white/10"
            >
              Voir mes dépenses
            </button>
          </div>
        </div>
      )}
      {confirmDialog}
    </Layout>
  );
}

// Chip de filtre catégorie (actif = teal plein).
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none rounded-[20px] px-3.5 py-2 text-[13px] transition ${
        active
          ? 'bg-primo-teal font-bold text-white'
          : 'border border-primo-line bg-white font-semibold text-primo-slate hover:bg-primo-mint'
      }`}
    >
      {children}
    </button>
  );
}
