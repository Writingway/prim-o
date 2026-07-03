import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import { formatDate } from '@/lib/format';
import { listAdminCompanies } from '@/services/api';
import type { AdminCompany, AdminStats, Offer } from '@/types/types';
import {
  ADMIN_BADGE,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_GHOST,
} from '@/pages/adminClasses';

type Props = {
  stats: AdminStats;
  offers: Offer[];
  onManageCompanies: () => void;
  onManageOffers: () => void;
  onAuthExpired: () => void;
};


// Deterministic coloured avatar derived from the company name (primo palette tokens only).
const AVATAR_BG = [
  'bg-primo-teal-soft text-primo-teal-dark',
  'bg-primo-warn-soft text-primo-warn-strong',
  'bg-primo-success-soft text-primo-success',
  'bg-primo-mint text-primo-teal-dark',
];

function avatarFor(name: string) {
  const initials = name.trim().slice(0, 2).toUpperCase() || '??';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_BG.length;
  return { initials, cls: AVATAR_BG[hash] };
}

// Company status → badge label + class (reuses ADMIN_BADGE).
const STATUS_BADGE: Record<AdminCompany['status'], { label: string; cls: string }> = {
  APPROVED: { label: 'Actif', cls: `${ADMIN_BADGE} bg-primo-success-soft text-primo-success` },
  PENDING: { label: 'Attente', cls: `${ADMIN_BADGE} bg-primo-warn-soft text-primo-warn-strong` },
  REJECTED: { label: 'Suspendu', cls: `${ADMIN_BADGE} bg-primo-error-soft text-primo-error` },
};

const KPI_CARD = 'rounded-xl border border-primo-line bg-white p-3 sm:rounded-2xl sm:p-5';
const KPI_CHIP =
  'flex h-8 w-8 items-center justify-center rounded-[8px] bg-primo-teal-soft text-primo-teal-dark sm:h-[38px] sm:w-[38px] sm:rounded-[10px]';
const KPI_NUMBER = 'mt-2 text-[22px] font-extrabold tracking-[-0.02em] text-primo-ink sm:mt-3 sm:text-[34px]';
const KPI_LABEL = 'text-[11px] text-primo-gray sm:text-[13px]';
const PANEL = 'rounded-2xl border border-primo-line bg-white p-5 lg:p-6';

export default function AdminOverview({
  stats,
  offers,
  onManageCompanies,
  onManageOffers,
  onAuthExpired,
}: Props) {
  const [companies, setCompanies] = useState<AdminCompany[] | null>(null);
  const [total, setTotal] = useState(0);
  const [tokensIssued, setTokensIssued] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // First page (limit capped at 100): feeds the preview and seeds the exact token count.
      const first = await listAdminCompanies(1, 100);
      if (!first.ok || !first.data) {
        if (first.status === 401) onAuthExpired();
        else setError('Impossible de charger les entreprises.');
        return;
      }
      setCompanies(first.data.items);
      setTotal(first.data.total);

      // Tokens in circulation = exact sum over ALL companies. Remaining pages are
      // fetched in parallel (the backend caps limit at 100).
      const pages = Math.ceil(first.data.total / 100);
      const rest =
        pages > 1
          ? await Promise.all(
              Array.from({ length: pages - 1 }, (_, i) => listAdminCompanies(i + 2, 100)),
            )
          : [];
      const all = [first.data.items, ...rest.map((r) => (r.ok && r.data ? r.data.items : []))];
      setTokensIssued(all.flat().reduce((sum, c) => sum + c.tokenBalance, 0));
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }, [onAuthExpired]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const activeOffers = offers.filter((o) => o.isActive).length;

  // Offers that carry a promo-code stock (these fields only exist in the admin view).
  const offersWithCodes = offers.filter(
    (o) => (o.availableCodes ?? 0) > 0 || (o.usedCodes ?? 0) > 0,
  );
  const lowStock = offersWithCodes
    .map((o) => {
      const used = o.usedCodes ?? 0;
      const totalCodes = used + (o.availableCodes ?? 0);
      const pct = totalCodes > 0 ? Math.round((used / totalCodes) * 100) : 0;
      return { offer: o, used, totalCodes, pct, low: pct >= 90 };
    })
    .filter((x) => x.low);

  const preview = (companies ?? []).slice(0, 6);

  return (
    <div className="flex flex-col gap-5 py-1 lg:min-h-0 lg:flex-1 lg:px-2">
      {/* KPI row. */}
      <div className="grid flex-none grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className={KPI_CARD}>
          <div className={KPI_CHIP}>
            <Icon name="building" size={16} strokeWidth={1.8} className="sm:hidden" />
            <Icon name="building" size={20} strokeWidth={1.8} className="hidden sm:block" />
          </div>
          <div className={KPI_NUMBER}>{stats.companies}</div>
          <div className={KPI_LABEL}>Entreprises actives</div>
        </div>

        <div className={KPI_CARD}>
          <div className={KPI_CHIP}>
            <Icon name="users" size={16} strokeWidth={1.8} className="sm:hidden" />
            <Icon name="users" size={20} strokeWidth={1.8} className="hidden sm:block" />
          </div>
          <div className={KPI_NUMBER}>{stats.users}</div>
          <div className={KPI_LABEL}>Utilisateurs enregistrés</div>
        </div>

        {/* Dark gold-accent card: tokens in circulation. */}
        <div className="rounded-xl bg-primo-ink-900 p-3 text-white sm:rounded-2xl sm:p-5">
          <div className="flex items-start justify-between">
            <Coin size={28} className="sm:hidden" />
            <span className="rounded-full bg-primo-gold px-2 py-0.5 text-[10px] font-extrabold text-primo-ink-900 sm:px-2.5 sm:text-[11px]">
              En circ.
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold tracking-[-0.02em] text-white sm:mt-3 sm:text-[34px]">
            {tokensIssued === null ? '…' : tokensIssued.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-white/65 sm:text-[13px]">Tokens émis</div>
        </div>

        <div className={KPI_CARD}>
          <div className={KPI_CHIP}>
            <Icon name="gift" size={16} strokeWidth={1.8} className="sm:hidden" />
            <Icon name="gift" size={20} strokeWidth={1.8} className="hidden sm:block" />
          </div>
          <div className={KPI_NUMBER}>{activeOffers}</div>
          <div className={KPI_LABEL}>Offres actives</div>
        </div>
      </div>

      {/* Bottom two-column area. */}
      <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_380px]">
        {/* Left: companies preview. */}
        <div className={`${PANEL} flex flex-col lg:min-h-0 lg:overflow-hidden`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-primo-ink">Entreprises</h2>
              <p className="text-[13px] text-primo-gray">
                {total} {total > 1 ? 'sociétés enregistrées' : 'société enregistrée'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className={ADMIN_BTN_GHOST} onClick={onManageCompanies}>
                Filtrer
              </button>
              <button type="button" className={ADMIN_BTN_PRIMARY} onClick={onManageCompanies}>
                + Ajouter
              </button>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-primo-gray">Chargement…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-primo-error">{error}</p>
          ) : preview.length === 0 ? (
            <p className="py-8 text-center text-sm text-primo-gray">Aucune entreprise enregistrée.</p>
          ) : (
            <>
              {/* Column headers - hidden on mobile. */}
              <div className="hidden grid-cols-[1fr_110px_110px_90px] gap-3 border-b border-primo-line pb-2 text-[11px] font-semibold uppercase tracking-wide text-primo-gray sm:grid">
                <span>Entreprise</span>
                <span>Utilisateurs</span>
                <span>Statut</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-primo-line lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {preview.map((c) => {
                  const av = avatarFor(c.name);
                  const badge = STATUS_BADGE[c.status];
                  return (
                    <div
                      key={c.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 sm:grid-cols-[1fr_110px_110px_90px]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-[12px] font-bold ${av.cls}`}
                        >
                          {av.initials}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-bold text-primo-ink">{c.name}</div>
                          <div className="text-[12px] text-primo-gray">{formatDate(c.createdAt)}</div>
                        </div>
                      </div>
                      <div className="hidden text-[13px] text-primo-gray sm:block">
                        {c._count.users} emp.
                      </div>
                      <div className="hidden sm:block">
                        <span className={badge.cls}>{badge.label}</span>
                      </div>
                      <div className="text-right">
                        <button
                          type="button"
                          className="text-[13px] font-semibold text-primo-teal transition hover:text-primo-teal-dark"
                          onClick={onManageCompanies}
                        >
                          Éditer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-primo-line pt-3">
                <span className="text-[13px] text-primo-gray">
                  Affichage 1-{preview.length} sur {total}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-primo-teal transition hover:text-primo-teal-dark"
                  onClick={onManageCompanies}
                >
                  Voir tout <Icon name="chevron-right" size={15} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right column. */}
        <div className="flex flex-col gap-4 lg:min-h-0">
          {/* Promo-code stock per partner. */}
          <div className={`${PANEL} flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-extrabold text-primo-ink">Stock codes promo</h3>
                <p className="text-[12px] text-primo-gray">Par partenaire</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-primo-teal px-3 py-1.5 text-[13px] font-semibold text-primo-teal transition hover:bg-primo-teal-soft"
                onClick={onManageOffers}
              >
                Gérer
              </button>
            </div>

            {offersWithCodes.length === 0 ? (
              <p className="py-6 text-center text-sm text-primo-gray">Aucun stock de codes.</p>
            ) : (
              <div className="space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {offersWithCodes.map((offer) => {
                  const used = offer.usedCodes ?? 0;
                  const totalCodes = used + (offer.availableCodes ?? 0);
                  const pct = totalCodes > 0 ? Math.round((used / totalCodes) * 100) : 0;
                  const low = pct >= 90;
                  const icon = (offer.category?.icon ?? 'gift') as IconName;
                  return (
                    <div key={offer.id}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primo-teal-soft text-primo-teal-dark">
                          <Icon name={icon} size={18} strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-primo-ink">
                            {offer.partnerName}
                          </div>
                          <div className="text-[12px] text-primo-gray">
                            {used} / {totalCodes} utilisés
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            low ? 'bg-primo-warn-soft text-primo-warn-strong' : 'bg-primo-teal-soft text-primo-teal'
                          }`}
                        >
                          {low ? 'Bas' : 'OK'}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primo-line">
                        <div
                          className={`h-full transition-all ${low ? 'bg-primo-warn-strong' : 'bg-primo-teal'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Critical stock alert - only when an offer has ≥ 90% of its codes used. */}
          {lowStock.length > 0 && (
            <div className="rounded-2xl border border-primo-warn-strong/30 bg-primo-warn-soft p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-white/60 text-primo-warn-strong">
                  <Icon name="alert" size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="text-[14px] font-extrabold text-primo-warn-strong">
                    Stock {lowStock[0].offer.partnerName} critique
                  </div>
                  <p className="mt-0.5 text-[13px] text-primo-warn-strong/90">
                    {lowStock[0].pct}% des codes {lowStock[0].offer.partnerName} sont épuisés.
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-[13px] font-bold text-primo-warn-strong underline-offset-2 hover:underline"
                    onClick={onManageOffers}
                  >
                    Réapprovisionner
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
