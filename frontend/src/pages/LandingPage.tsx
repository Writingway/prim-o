import { useEffect, useState } from 'react';
import { listOffers, redeemOffer } from '../services/api';
import type { Offer, Role } from '../types/types';
import Layout from '../components/layout/Layout';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { HEADER_BTN_PRIMARY, HEADER_BTN_GHOST } from '../components/layout/headerButtons';

// Classes Tailwind réutilisées (déduplication, cf. authClasses.ts / ConfirmDialog BTN).
const OFFER_EMOJI = 'mb-2.5 text-[40px] leading-none';
const OFFER_COST = 'text-[15px] font-semibold text-primo-teal';
const MODAL_OVERLAY =
  'fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4';
const MODAL =
  'w-full max-w-[420px] rounded-2xl bg-white px-6 py-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]';
const MODAL_TITLE = 'mb-1.5 text-xl text-[#111827]';
const MODAL_SUB = 'mb-4 text-sm text-primo-gray';
const MODAL_ACTIONS = 'flex justify-center gap-2';
const MODAL_NOTE = 'mt-3.5 text-xs text-primo-gray-light';

type LandingPageProps = {
  isLoggedIn: boolean;
  role?: Role;
  onLogin: () => void;
  onRegister: () => void;
  onDashboard: () => void;
  onLogout: () => void;
};

const categoryMeta: Record<Offer['category'], { emoji: string; label: string }> = {
  FOOD: { emoji: '🍔', label: 'Restauration' },
  SHOPPING: { emoji: '🛍️', label: 'Shopping' },
  CULTURE: { emoji: '🎬', label: 'Culture' },
  TRAVEL: { emoji: '✈️', label: 'Voyage' },
  WELLNESS: { emoji: '🧘', label: 'Bien-être' },
  OTHER: { emoji: '🎁', label: 'Autre' },
};

type Revealed = { code: string; offerName: string; amount: number };

// Page d'accueil / hub : header adaptatif + vitrine d'offres partenaires.
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

  // Détail d'offre cliqué + achat (employé).
  const [selected, setSelected] = useState<Offer | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [redeemError, setRedeemError] = useState('');

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

  const openDetail = (offer: Offer) => {
    setRedeemError('');
    setSelected(offer);
  };

  const handleRedeem = async (offer: Offer) => {
    setRedeemError('');
    const ok = await confirm({
      title: `Acheter pour ${offer.cost} tokens ?`,
      message: `Obtenir un code « ${offer.partnerName} » en échange de ${offer.cost} tokens ?`,
      confirmLabel: 'Acheter',
    });
    if (!ok) return;

    setRedeeming(true);
    try {
      const res = await redeemOffer(offer.id);
      if (res.ok && res.data) {
        setSelected(null); // ferme le détail
        setRevealed(res.data); // ouvre la révélation du code
      } else if (res.status === 401) {
        setRedeemError('Session expirée, reconnecte-toi.');
      } else if (res.data && typeof res.data === 'object' && 'error' in res.data) {
        setRedeemError(String((res.data as { error: string }).error));
      } else {
        setRedeemError("Impossible d'acheter pour le moment.");
      }
    } catch {
      setRedeemError('Impossible de joindre le serveur.');
    } finally {
      setRedeeming(false);
    }
  };

  const selectedMeta = selected ? (categoryMeta[selected.category] ?? categoryMeta.OTHER) : null;

  return (
    <Layout
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
    <div className="min-h-screen bg-[#f4f5f7]">
      <section className="px-5 pt-16 pb-10 text-center">
        <h1 className="mx-auto max-w-[720px] text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-[#1f2937] sm:text-[40px]">
          Tes efforts récompensés instantanément
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-[18px] text-primo-gray">
          Échange tes tokens contre des offres exclusives chez nos partenaires.
        </p>
      </section>

      <section className="mx-auto max-w-[1000px] px-5 pt-6 pb-16">
        <h2 className="mb-5 text-center text-[22px] font-bold text-[#1f2937]">Nos offres partenaires</h2>

        {loading ? (
          <p className="text-center text-primo-gray-light">Chargement des offres…</p>
        ) : offers.length === 0 ? (
          <p className="text-center text-primo-gray-light">Aucune offre disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {offers.map((o) => {
              const meta = categoryMeta[o.category] ?? categoryMeta.OTHER;
              return (
                <article
                  className="relative cursor-pointer rounded-[14px] border border-primo-border bg-white px-[18px] py-[22px] text-center transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                  key={o.id}
                  onClick={() => openDetail(o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') openDetail(o); }}
                >
                  <span className="absolute right-3 top-3 rounded-[20px] bg-[#ecfdf5] px-2 py-[3px] text-xs font-bold text-primo-success">-{o.discountPercent}%</span>
                  <div className={OFFER_EMOJI}>{meta.emoji}</div>
                  <h3 className="text-[17px] font-bold text-[#111827]">{o.partnerName}</h3>
                  <p className="mb-3 mt-1 text-xs uppercase tracking-[0.5px] text-primo-gray-light">{meta.label}</p>
                  <p className={OFFER_COST}>{o.cost} 🪙 tokens</p>
                  <span className="mt-2.5 block text-[13px] font-semibold text-primo-teal">Voir le détail →</span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>

    {/* Détail d'une offre */}
    {selected && selectedMeta && (
      <div className={MODAL_OVERLAY} onClick={() => setSelected(null)}>
        <div className={MODAL} onClick={(e) => e.stopPropagation()}>
          <div className={OFFER_EMOJI}>{selectedMeta.emoji}</div>
          <h3 className={MODAL_TITLE}>{selected.partnerName}</h3>
          <p className={MODAL_SUB}>{selectedMeta.label} · -{selected.discountPercent}%</p>
          <p className={OFFER_COST}>{selected.cost} 🪙 tokens</p>
          <p className={selected.available ? 'mt-1 font-semibold text-primo-success' : 'mt-1 font-semibold text-primo-error'}>
            {selected.available ? '✅ Disponible' : '❌ Épuisé'}
          </p>

          {redeemError && <p className="mb-3 text-center text-primo-error">{redeemError}</p>}

          <div className={MODAL_ACTIONS}>
            {canRedeem && (
              <button
                className={HEADER_BTN_PRIMARY}
                type="button"
                disabled={!selected.available || redeeming}
                onClick={() => handleRedeem(selected)}
              >
                {redeeming ? '…' : `Acheter (${selected.cost})`}
              </button>
            )}
            <button className={HEADER_BTN_GHOST} type="button" onClick={() => setSelected(null)}>
              Fermer
            </button>
          </div>
          {!canRedeem && (
            <p className={MODAL_NOTE}>
              {isLoggedIn
                ? "Achat réservé aux employés et aux managers."
                : "Connecte-toi en tant qu'employé ou manager pour acheter un code."}
            </p>
          )}
        </div>
      </div>
    )}

    {/* Révélation du code obtenu */}
    {revealed && (
      <div className={MODAL_OVERLAY} onClick={() => setRevealed(null)}>
        <div className={MODAL} onClick={(e) => e.stopPropagation()}>
          <h3 className={MODAL_TITLE}>🎉 Code « {revealed.offerName} »</h3>
          <p className={MODAL_SUB}>{revealed.amount} tokens débités. Voici ton code :</p>
          <div className="mb-4 break-all rounded-[10px] border border-dashed border-primo-teal bg-primo-teal-soft p-3.5 font-mono text-[22px] font-bold tracking-[1px] text-primo-teal-dark">{revealed.code}</div>
          <div className={MODAL_ACTIONS}>
            <button
              className={HEADER_BTN_GHOST}
              type="button"
              onClick={() => navigator.clipboard.writeText(revealed.code)}
            >
              Copier
            </button>
            <button className={HEADER_BTN_PRIMARY} type="button" onClick={() => setRevealed(null)}>
              Fermer
            </button>
          </div>
          <p className={MODAL_NOTE}>Tu le retrouveras dans « Mes dépenses » sur ton tableau de bord.</p>
        </div>
      </div>
    )}
    {confirmDialog}
  </Layout>
  );
}
