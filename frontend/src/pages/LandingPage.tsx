import { useEffect, useState } from 'react';
import { listOffers } from '../services/api';
import type { Offer } from '../types/types';
import './LandingPage.css';
import Layout from '../components/layout/Layout';

type LandingPageProps = {
  isLoggedIn: boolean;
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

// Page d'accueil / hub : header adaptatif + vitrine d'offres partenaires.
export default function LandingPage({
  isLoggedIn,
  onLogin,
  onRegister,
  onDashboard,
  onLogout,
}: LandingPageProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

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
                <article className="offer-card" key={o.id}>
                  <span className="offer-discount">-{o.discountPercent}%</span>
                  <div className="offer-emoji">{meta.emoji}</div>
                  <h3 className="offer-name">{o.partnerName}</h3>
                  <p className="offer-category">{meta.label}</p>
                  <p className="offer-cost">{o.cost} 🪙 tokens</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  </Layout>
  );
}
