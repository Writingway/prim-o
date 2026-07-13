import { useEffect, useMemo, useState } from 'react';
import { listOffers, redeemOffer, assetUrl } from '@/services/api';
import { listCategories } from '@/services/api/categories';
import type { Offer, Category } from '@/types/types';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import tkn2 from '@/assets/primotoken/primo-tkn2.png';

// Partner offer catalog: grid + search/filters + detail bottom sheet + code-reveal celebration.
// Reused by the LandingPage (visitors) AND the employee area's « Offres » section - one source,
// so the experience is identical in both places. See README C1/C2/C3.
const CTA_PRIMARY =
  'w-full rounded-2xl border-0 bg-primo-teal px-4 py-4 text-base font-bold text-white shadow-[0_12px_26px_-8px_rgba(0,161,154,0.6)] transition hover:bg-primo-teal-strong disabled:opacity-60';

// Grid pagination: render in batches; « Voir plus » extends the window.
const PAGE_SIZE = 8;

type Revealed = { code: string; offerName: string; amount: number };

type OfferCatalogProps = {
  isLoggedIn: boolean;
  // True for employees and managers - the only roles allowed to redeem.
  canRedeem: boolean;
  // Lets the parent refresh balance/history after a redemption.
  onRedeemed?: () => void;
  // Wired to the celebration screen's « Voir mes codes » button; the button is hidden when absent.
  onSeeSpending?: () => void;
  heading?: string;
  // Spacing is owned by the parent (landing vs dashboard).
  className?: string;
  // Landing only: on desktop (≥ lg), large square cards in 3 columns. Mobile keeps the compact
  // format in all cases.
  largeDesktopCards?: boolean;
};

export default function OfferCatalog({
  isLoggedIn,
  canRedeem,
  onRedeemed,
  onSeeSpending,
  heading = 'Offres partenaires',
  className = '',
  largeDesktopCards = false,
}: OfferCatalogProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | 'ALL'>('ALL');

  const [selected, setSelected] = useState<Offer | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Reset pagination the moment search/category changes - during render,
  // before paint, so there's no second render pass.
  const resetKey = `${query}|${activeCat}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setVisible(PAGE_SIZE);
  }

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

  useEffect(() => {
    listCategories().then((res) => {
      if (res.ok && res.data) setCategories(res.data.categories);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter(
      (o) =>
        (activeCat === 'ALL' || o.category?.id === activeCat) &&
        (q === '' || o.partnerName.toLowerCase().includes(q)),
    );
  }, [offers, query, activeCat]);

  // Featured pick: the best available deal (highest discount), showcased at the top of the
  // catalog. Default view only - hidden as soon as the user filters or searches.
  const featured = useMemo(() => {
    const pool = offers.filter((o) => o.available);
    if (pool.length === 0) return null;
    return [...pool].sort((a, b) => b.discountPercent - a.discountPercent)[0];
  }, [offers]);
  const showFeatured = !!featured && activeCat === 'ALL' && query.trim() === '';
  const gridOffers = showFeatured && featured ? filtered.filter((o) => o.id !== featured.id) : filtered;

  const openDetail = (offer: Offer) => {
    setRedeemError('');
    setSelected(offer);
  };

  const handleRedeem = async (offer: Offer) => {
    setRedeemError('');
    const ok = await confirm({
      title: `Échanger ${offer.cost} tokens ?`,
      message: `Obtenir un code « ${offer.partnerName} » en échange de ${offer.cost} tokens ?`,
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
        onRedeemed?.();
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

  const selectedMeta = selected?.category ?? null;

  // Landing desktop: 3 columns with square visuals (larger cards), mobile unchanged.
  // Otherwise the original compact grid (employee area).
  const gridClass = largeDesktopCards
    ? 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5'
    : 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3';
  const visualClass = largeDesktopCards
    ? 'h-[104px] w-full lg:h-auto lg:aspect-square'
    : 'h-[104px] w-full';

  return (
    <>
      <section className={className} aria-label={heading}>

        <div className="mt-4 flex items-center gap-2.5 rounded-[16px] border-[1.5px] border-primo-line bg-white px-3.5 py-3 transition focus-within:border-primo-teal focus-within:ring-2 focus-within:ring-primo-teal/15">
          <Icon name="search" size={19} className="flex-none text-primo-muted" />
          <input
            className="w-full border-0 bg-transparent text-sm text-primo-ink placeholder:text-primo-muted focus:outline-none"
            type="search"
            placeholder="Rechercher une réduction"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Category filter rail - horizontally scrollable, scrollbar hidden. */}
        {categories.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-3.5 overflow-x-auto pb-1">
            <CategoryPill
              active={activeCat === 'ALL'}
              icon="star"
              label="Tout"
              color="#00a19a"
              onClick={() => setActiveCat('ALL')}
            />
            {categories.map((c) => {
              const on = activeCat === c.id;
              return (
                <CategoryPill
                  key={c.id}
                  active={on}
                  icon={c.icon as IconName}
                  label={c.label}
                  color={c.color}
                  onClick={() => setActiveCat(c.id)}
                />
              );
            })}
          </div>
        )}

        {loading ? (
          // Skeleton previews the storefront layout instead of a grey loading message.
          <div className="mt-6">
            <div className="h-[168px] w-full animate-pulse rounded-[24px] bg-primo-line/70" />
            <div className={`mt-5 ${gridClass}`}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-[22px] border border-primo-line bg-white">
                  <div className={largeDesktopCards ? 'h-[104px] bg-primo-line/70 lg:h-auto lg:aspect-square' : 'h-[104px] bg-primo-line/70'} />
                  <div className="space-y-2 p-3.5">
                    <div className="h-3.5 w-3/4 rounded bg-primo-line/70" />
                    <div className="h-3 w-1/3 rounded bg-primo-line/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          // Empty state invites an action - never a dead end.
          <div className="mt-8 flex flex-col items-center rounded-[24px] border border-dashed border-primo-line bg-white px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primo-mint text-primo-teal-strong">
              <Icon name={offers.length === 0 ? 'gift' : 'search'} size={26} />
            </span>
            <p className="mt-4 text-[15px] font-bold text-primo-ink">
              {offers.length === 0 ? 'La vitrine se prépare' : 'Aucune offre ne correspond'}
            </p>
            <p className="mt-1 max-w-[260px] text-[13px] text-primo-slate-soft">
              {offers.length === 0
                ? 'De nouvelles offres partenaires arrivent très bientôt. Reviens vite.'
                : 'Élargis ta recherche ou change de catégorie pour voir plus de bons plans.'}
            </p>
            {offers.length > 0 && (query.trim() !== '' || activeCat !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveCat('ALL'); }}
                className="mt-5 rounded-full bg-primo-teal px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-primo-teal-strong"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured deal, full-bleed card. */}
            {showFeatured && featured && (() => {
              const meta = featured.category ?? { icon: 'gift', color: '#00a19a', label: '' };
              return (
                <button
                  type="button"
                  onClick={() => openDetail(featured)}
                  className="group relative mt-6 block w-full overflow-hidden rounded-[26px] text-left shadow-[0_22px_50px_-22px_rgba(6,48,45,0.55)] outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primo-teal focus-visible:ring-offset-2"
                >
                  <CategoryVisual meta={meta} className="aspect-[16/9] w-full sm:aspect-[21/8]" watermark={220} imageUrl={featured.imageUrl} />
                  {/* Dark bottom gradient keeps the overlaid text legible. */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-primo-ink-900 backdrop-blur-sm">
                    <Icon name="flame" size={13} strokeWidth={2} className="text-primo-gold" /> Offre à la une
                  </span>
                  {featured.discountPercent > 0 && (
                    <DiscountBadge percent={featured.discountPercent} className="absolute right-4 top-4 px-3 py-1.5 text-[13px]" />
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/75">{meta.label}</p>
                      <h3 className="mt-0.5 truncate text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-white">
                        {featured.partnerName}
                      </h3>
                    </div>
                    <span className="flex flex-none items-center gap-1.5 rounded-full bg-white px-3.5 py-2 shadow-lg">
                      <Coin size={20} />
                      <span className="text-[16px] font-extrabold tracking-[-0.01em] text-primo-teal-strong">{featured.cost}</span>
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* Offer grid. */}
            <div className={`mt-6 ${gridClass}`}>
              {gridOffers.slice(0, visible).map((o, i) => {
                const meta = o.category ?? { icon: 'gift', color: '#00a19a', label: '' };
                return (
                  <article
                    key={o.id}
                    onClick={() => openDetail(o)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') openDetail(o); }}
                    style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                    className="group flex animate-offer-in cursor-pointer flex-col overflow-hidden rounded-[22px] border border-primo-line bg-white outline-none transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_18px_38px_-16px_rgba(6,48,45,0.32)] focus-visible:ring-2 focus-visible:ring-primo-teal focus-visible:ring-offset-2"
                  >
                    <div className="relative">
                      <CategoryVisual meta={meta} className={visualClass} watermark={108} avatar={32} imageUrl={o.imageUrl} />
                      {o.discountPercent > 0 && (
                        <DiscountBadge percent={o.discountPercent} className="absolute right-2.5 top-2.5" />
                      )}
                      {!o.available && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                          Épuisé
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3.5">
                      <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-primo-ink">{o.partnerName}</h3>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-primo-muted">{meta.label}</p>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <TokenPrice cost={o.cost} />
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primo-mint text-primo-teal-strong transition group-hover:bg-primo-teal group-hover:text-white">
                          <Icon name="chevron-right" size={16} />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {gridOffers.length > visible && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full border-[1.5px] border-primo-line bg-white px-6 py-2.5 text-sm font-bold text-primo-teal-strong transition hover:border-primo-teal hover:bg-primo-mint"
                >
                  Voir plus d'offres
                </button>
                <span className="text-xs text-primo-muted">{visible} sur {gridOffers.length}</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Offer detail - bottom sheet (C2). */}
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
            <CategoryVisual
              meta={selectedMeta}
              className="flex h-[88px] w-[88px] items-center justify-center rounded-[26px] shadow-[0_14px_30px_-12px_rgba(6,48,45,0.4)]"
              watermark={96}
              avatar={44}
              imageUrl={selected.imageUrl}
            />
            <h3 className="mt-[18px] text-[26px] font-extrabold tracking-[-0.02em] text-primo-ink">
              {selected.partnerName}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-[20px] bg-primo-mint px-3 py-[5px] text-xs font-semibold text-primo-teal-strong">
                {selectedMeta?.label}
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
                {redeeming ? '…' : `Échanger ${selected.cost} tokens`}
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

      {/* Code reveal - celebration screen (C3). */}
      {revealed && (
        <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden bg-gradient-to-b from-primo-hero-from via-primo-ink-900 to-primo-ink-950 text-white">
          {/* Static confetti. */}
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
            <img
              src={tkn2}
              alt=""
              width={118}
              height={118}
              className="animate-primo-float select-none"
              style={{ filter: 'drop-shadow(0 24px 50px rgba(232,148,23,0.6))' }}
              draggable={false}
              aria-hidden
            />
            <div className="mt-7 text-[28px] font-extrabold tracking-[-0.02em]">Code débloqué !</div>
            <p className="mt-2.5 text-[15px] text-white/70">
              {revealed.amount} tokens débités · {revealed.offerName}
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

          {onSeeSpending && (
            <div className="px-8 pb-11">
              <button
                type="button"
                onClick={() => {
                  setRevealed(null);
                  onSeeSpending();
                }}
                className="mx-auto flex w-full max-w-[320px] items-center justify-center gap-2 rounded-[15px] border-[1.5px] border-white/25 bg-transparent px-4 py-3.5 text-base font-bold text-white hover:bg-white/10"
              >
                <Icon name="ticket" size={19} /> Voir mes codes
              </button>
            </div>
          )}
        </div>
      )}
      {confirmDialog}
    </>
  );
}

// Category visual: diagonal gradient, oversized watermark glyph bleeding out of the frame,
// light sheen on top. `avatar` > 0 adds a crisp foreground icon. Background comes from either
// a dynamic `color` (inline style) or a legacy Tailwind `grad` class.
function CategoryVisual({
  meta,
  className = '',
  watermark = 84,
  avatar = 0,
  imageUrl,
}: {
  meta: { icon: string; grad?: string; color?: string };
  className?: string;
  watermark?: number;
  avatar?: number;
  imageUrl?: string | null;
}) {
  // Uploaded photo (already cropped square by the admin): `object-cover` makes it fill any
  // frame (square, banner, thumbnail) without distortion.
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-primo-line ${className}`}>
        <img src={assetUrl(imageUrl)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  const bgStyle = meta.color
    ? { background: `linear-gradient(135deg, ${meta.color}dd 0%, ${meta.color}88 100%)` }
    : undefined;
  const bgClass = meta.grad ? `bg-gradient-to-br ${meta.grad}` : '';

  return (
    <div className={`relative overflow-hidden ${bgClass} ${className}`} style={bgStyle}>
      {/* Top-left light sheen gives the flat gradient some depth. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
      {/* Watermark: the category icon, oversized and bleeding out of the frame. */}
      <Icon
        name={meta.icon as IconName}
        size={watermark}
        strokeWidth={1.4}
        className="pointer-events-none absolute -bottom-5 -right-4 text-white/15"
      />
      {avatar > 0 && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center justify-center rounded-2xl bg-white/18 p-2.5 ring-1 ring-white/25 backdrop-blur-[2px]">
            <Icon name={meta.icon as IconName} size={avatar} strokeWidth={1.7} className="text-white" />
          </span>
        </span>
      )}
    </div>
  );
}

// Gold discount badge - the eye-catcher, reserved for the discount percentage alone.
function DiscountBadge({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primo-gold px-2.5 py-1 text-[12px] font-extrabold leading-none text-primo-ink-900 shadow-[0_4px_12px_-2px_rgba(255,183,46,0.7)] ${className}`}
    >
      <Icon name="flame" size={12} strokeWidth={2} />
      −{percent}%
    </span>
  );
}

// Price in tokens (coin + number) - the single unit used across the whole catalog.
function TokenPrice({ cost, size = 17, text = 'text-sm' }: { cost: number; size?: number; text?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Coin size={size} />
      <span className={`font-extrabold tracking-[-0.01em] text-primo-teal-strong ${text}`}>{cost}</span>
    </span>
  );
}

// Category filter pill: colored icon circle with the label below. Active: solid circle, bold
// label; inactive: soft tint via the '22' hex-alpha suffix. Colors are dynamic, hence inline
// styles.
function CategoryPill({
  active,
  icon,
  label,
  color,
  onClick,
}: {
  active: boolean;
  icon: IconName;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex flex-none flex-col items-center gap-1.5 outline-none"
    >
      <span
        style={{ backgroundColor: active ? color : color + '22', color: active ? 'white' : color }}
        className={`flex h-[58px] w-[58px] items-center justify-center rounded-full transition ${
          active ? 'shadow-[0_8px_18px_-8px_rgba(6,48,45,0.4)]' : ''
        }`}
      >
        <Icon name={icon} size={24} />
      </span>
      <span
        className={`max-w-[66px] truncate text-[11px] ${
          active ? 'font-bold text-primo-ink' : 'font-semibold text-primo-slate'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
