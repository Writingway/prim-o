import { useEffect, useState } from 'react';
import { listOffers, redeemOffer } from '../services/api';
import type { Offer, Role } from '../types/types';
import './LandingPage.css';
import Layout from '../components/layout/Layout';
import { useConfirm } from '../components/ui/ConfirmDialog';

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

  const isEmployee = isLoggedIn && role === 'employee';

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
            <button className="app-btn app-btn-primary" type="button" onClick={onDashboard}>
              Mon tableau de bord
            </button>
            <button className="app-btn app-btn-ghost" type="button" onClick={onLogout}>
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <button className="app-btn app-btn-ghost" type="button" onClick={onLogin}>
              Se connecter
            </button>
            <button className="app-btn app-btn-primary" type="button" onClick={onRegister}>
              S'inscrire
            </button>
          </>
        )
      }
    >
    <div className="landing-wrapper">
      <section className="landing-hero">
        <h1 className="landing-hero-title">Tes efforts récompensés instantanément</h1>
        <p className="landing-hero-sub">
          Échange tes tokens contre des offres exclusives chez nos partenaires.
        </p>
      </section>

      <section className="landing-offers">
        <h2 className="landing-offers-title">Nos offres partenaires</h2>

        {loading ? (
          <p className="landing-muted">Chargement des offres…</p>
        ) : offers.length === 0 ? (
          <p className="landing-muted">Aucune offre disponible pour le moment.</p>
        ) : (
          <div className="offer-grid">
            {offers.map((o) => {
              const meta = categoryMeta[o.category] ?? categoryMeta.OTHER;
              return (
                <article
                  className="offer-card offer-card-clickable"
                  key={o.id}
                  onClick={() => openDetail(o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') openDetail(o); }}
                >
                  <span className="offer-discount">-{o.discountPercent}%</span>
                  <div className="offer-emoji">{meta.emoji}</div>
                  <h3 className="offer-name">{o.partnerName}</h3>
                  <p className="offer-category">{meta.label}</p>
                  <p className="offer-cost">{o.cost} 🪙 tokens</p>
                  <span className="offer-details-hint">Voir le détail →</span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>

    {/* Détail d'une offre */}
    {selected && selectedMeta && (
      <div className="landing-modal-overlay" onClick={() => setSelected(null)}>
        <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
          <div className="offer-emoji">{selectedMeta.emoji}</div>
          <h3 className="landing-modal-title">{selected.partnerName}</h3>
          <p className="landing-modal-sub">{selectedMeta.label} · -{selected.discountPercent}%</p>
          <p className="offer-cost">{selected.cost} 🪙 tokens</p>
          <p className={selected.available ? 'offer-stock-ok' : 'offer-stock-ko'}>
            {selected.available ? '✅ Disponible' : '❌ Épuisé'}
          </p>

          {redeemError && <p className="landing-redeem-error">{redeemError}</p>}

          <div className="landing-modal-actions">
            {isEmployee && (
              <button
                className="app-btn app-btn-primary"
                type="button"
                disabled={!selected.available || redeeming}
                onClick={() => handleRedeem(selected)}
              >
                {redeeming ? '…' : `Acheter (${selected.cost})`}
              </button>
            )}
            <button className="app-btn app-btn-ghost" type="button" onClick={() => setSelected(null)}>
              Fermer
            </button>
          </div>
          {!isEmployee && (
            <p className="landing-modal-note">Connecte-toi en tant qu'employé pour acheter un code.</p>
          )}
        </div>
      </div>
    )}

    {/* Révélation du code obtenu */}
    {revealed && (
      <div className="landing-modal-overlay" onClick={() => setRevealed(null)}>
        <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="landing-modal-title">🎉 Code « {revealed.offerName} »</h3>
          <p className="landing-modal-sub">{revealed.amount} tokens débités. Voici ton code :</p>
          <div className="landing-modal-code">{revealed.code}</div>
          <div className="landing-modal-actions">
            <button
              className="app-btn app-btn-ghost"
              type="button"
              onClick={() => navigator.clipboard.writeText(revealed.code)}
            >
              Copier
            </button>
            <button className="app-btn app-btn-primary" type="button" onClick={() => setRevealed(null)}>
              Fermer
            </button>
          </div>
          <p className="landing-modal-note">Tu le retrouveras dans « Mes dépenses » sur ton tableau de bord.</p>
        </div>
      </div>
    )}
    {confirmDialog}
  </Layout>
  );
}
