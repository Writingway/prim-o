import { useEffect, useState } from 'react';
import {
  getEmployeeBalance,
  getEmployeeReceived,
  getEmployeeSpent,
  logout as apiLogout,
} from '../services/api';
import type { ReceivedToken, SpentToken } from '../types/types';
import './EmployeeDashboard.css';
import Layout from '../components/layout/Layout';
import PrivacySection from '../components/privacy/PrivacySection';


type EmployeeDashboardProps = {
  onLogout: () => void;
  onBack: () => void;
};

const PAGE_SIZE = 10;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function EmployeeDashboard({ onLogout, onBack }: EmployeeDashboardProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Historiques : items accumulés + page courante + s'il reste des pages.
  const [received, setReceived] = useState<ReceivedToken[]>([]);
  const [receivedPage, setReceivedPage] = useState(1);
  const [receivedHasMore, setReceivedHasMore] = useState(false);

  const [spent, setSpent] = useState<SpentToken[]>([]);
  const [spentPage, setSpentPage] = useState(1);
  const [spentHasMore, setSpentHasMore] = useState(false);

  // Chargement initial : solde + 1re page de chaque historique.
  const loadInitial = async () => {
    setLoading(true);
    setError('');
    try {
      const [balRes, recRes, spRes] = await Promise.all([
        getEmployeeBalance(),
        getEmployeeReceived(1, PAGE_SIZE),
        getEmployeeSpent(1, PAGE_SIZE),
      ]);

      if (balRes.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        return;
      }
      if (!balRes.ok || !balRes.data) {
        setError('Impossible de charger ton espace.');
        return;
      }

      setBalance(balRes.data.balance);
      if (recRes.ok && recRes.data) {
        setReceived(recRes.data.items);
        setReceivedPage(1);
        setReceivedHasMore(recRes.data.hasMore);
      }
      if (spRes.ok && spRes.data) {
        setSpent(spRes.data.items);
        setSpentPage(1);
        setSpentHasMore(spRes.data.hasMore);
      }
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // « Voir plus » : charge la page suivante et l'ajoute à la liste existante.
  const loadMoreReceived = async () => {
    const next = receivedPage + 1;
    const res = await getEmployeeReceived(next, PAGE_SIZE);
    if (res.ok && res.data) {
      setReceived((prev) => [...prev, ...res.data!.items]);
      setReceivedPage(next);
      setReceivedHasMore(res.data.hasMore);
    }
  };

  const loadMoreSpent = async () => {
    const next = spentPage + 1;
    const res = await getEmployeeSpent(next, PAGE_SIZE);
    if (res.ok && res.data) {
      setSpent((prev) => [...prev, ...res.data!.items]);
      setSpentPage(next);
      setSpentHasMore(res.data.hasMore);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // On déconnecte côté front même si l'appel réseau échoue.
    }
    onLogout();
  };

  return (
    <Layout
      title="Prim'O — Mon espace"
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>
            ← Accueil
          </button>
          <button className="app-btn app-btn-ghost" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </>
      }
    >
    <div className="emp-dash-wrapper">
      <div className="emp-dash-container">

        {loading && <p className="emp-dash-note">Chargement…</p>}

        {!loading && error && (
          <div className="emp-dash-note emp-dash-error">
            {error}{' '}
            <button type="button" className="emp-dash-retry" onClick={loadInitial}>Réessayer</button>
          </div>
        )}

        {!loading && !error && balance !== null && (
          <>
            <div className="emp-dash-cards">
              <div className="emp-dash-card">
                <div className="emp-dash-card-icon">🪙</div>
                <div className="emp-dash-card-label">Mon solde</div>
                <div className="emp-dash-card-value">{balance} tokens</div>
              </div>
            </div>

            <section className="emp-dash-section">
              <h2 className="emp-dash-section-title">Tokens reçus</h2>
              {received.length === 0 ? (
                <p className="emp-dash-muted">Aucun token reçu pour l'instant.</p>
              ) : (
                <>
                  <ul className="emp-tx-list">
                    {received.map((t) => (
                      <li className="emp-tx-row received" key={t.id}>
                        <div className="emp-tx-main">
                          <div className="emp-tx-reason">{t.reason}</div>
                          <div className="emp-tx-sub">de {t.managerName} · {formatDate(t.createdAt)}</div>
                        </div>
                        <div className="emp-tx-amount positive">+{t.amount}</div>
                      </li>
                    ))}
                  </ul>
                  {receivedHasMore && (
                    <button className="emp-dash-more" type="button" onClick={loadMoreReceived}>
                      Voir plus
                    </button>
                  )}
                </>
              )}
            </section>

            <section className="emp-dash-section">
              <h2 className="emp-dash-section-title">Mes dépenses</h2>
              {spent.length === 0 ? (
                <p className="emp-dash-muted">Aucune dépense pour l'instant.</p>
              ) : (
                <>
                  <ul className="emp-tx-list">
                    {spent.map((t) => (
                      <li className="emp-tx-row spent" key={t.id}>
                        <div className="emp-tx-main">
                          <div className="emp-tx-reason">{t.offerName}</div>
                          <div className="emp-tx-sub">code {t.promoCode} · {formatDate(t.createdAt)}</div>
                        </div>
                        <div className="emp-tx-amount negative">−{t.amount}</div>
                      </li>
                    ))}
                  </ul>
                  {spentHasMore && (
                    <button className="emp-dash-more" type="button" onClick={loadMoreSpent}>
                      Voir plus
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
        {!loading && <PrivacySection onAccountDeleted={onLogout} />}
      </div>
    </div>
    </Layout>
  );
}
