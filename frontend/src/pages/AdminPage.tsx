import { useEffect, useState } from 'react';
import { listOffers, createOffer, updateOffer } from '../services/api';
import type { Offer, OfferCategory } from '../types/types';
import './AdminPage.css';

type AdminPageProps = { accessToken: string; onLogout: () => void };

export default function AdminPage({ accessToken, onLogout }: AdminPageProps) { 
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listOffers(accessToken);
      if (res.ok && res.data) {
        setOffers(res.data.offers);
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger les offres.');
      }
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    const partnerName = prompt('Nom du partenaire ?');
    if (!partnerName) return;
    const costStr = prompt('Coût en points ?');
    const cost = Number(costStr);
    if (isNaN(cost) || cost < 0) {
      alert('Coût invalide.');
      return;
    }
    const discountStr = prompt('Pourcentage de réduction ?');
    const discountPercent = Number(discountStr);
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      alert('Pourcentage de réduction invalide.');
      return;
    }
    const category = prompt('Catégorie (FOOD, SHOPPING, CULTURE, TRAVEL, WELLNESS, OTHER) ?') as OfferCategory;
    if (!['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'].includes(category)) {
      alert('Catégorie invalide.');
      return;
    }
    try {
      const res = await createOffer(accessToken, { partnerName, cost, discountPercent, category });
      if (res.ok) {
        alert('Offre créée !');
        load();
      } else if (res.status === 401) {
        alert('Session expirée, reconnecte-toi.');
        onLogout();
      } else {
        alert('Erreur lors de la création de l\'offre.');
      }
    } catch {
      alert('Impossible de joindre le serveur. Le backend est-il lancé ?');
    }
  };

  const handleToggle = async (offerId: string) => {
    try {
      const offer = offers?.find(o => o.id === offerId);
      if (!offer) {
        alert('Offre introuvable.');
        return;
      }
      const res = await updateOffer(accessToken, offer.id, { isActive: !offer.isActive });
      if (res.ok) {
        alert(`Offre ${offer.isActive ? 'désactivée' : 'activée'} !`);
        load();
      } else if (res.status === 401) {
        alert('Session expirée, reconnecte-toi.');
        onLogout();
      } else {
        alert('Erreur lors de la mise à jour de l\'offre.');
      }
    } catch {
      alert('Impossible de joindre le serveur. Le backend est-il lancé ?');
    }
  };

  const handleUpdate = async (offerId: string) => {
    const partnerName = prompt('Nouveau nom du partenaire ? (laisse vide pour ne pas changer)');
    const costStr = prompt('Nouveau coût en points ? (laisse vide pour ne pas changer)');
    const discountStr = prompt('Nouveau pourcentage de réduction ? (laisse vide pour ne pas changer)');
    const category = prompt('Nouvelle catégorie (FOOD, SHOPPING, CULTURE, TRAVEL, WELLNESS, OTHER) ? (laisse vide pour ne pas changer)') as OfferCategory;

    const payload: Partial<Omit<Offer, 'id'>> = {};
    if (partnerName) payload.partnerName = partnerName;
    if (costStr) {
      const cost = Number(costStr);
      if (isNaN(cost) || cost < 0) {
        alert('Coût invalide.');
        return;
      }
      payload.cost = cost;
    }
    if (discountStr) {
      const discountPercent = Number(discountStr);
      if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        alert('Pourcentage de réduction invalide.');
        return;
      }
      payload.discountPercent = discountPercent;
    }
    if (category) {
      if (!['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'].includes(category)) {
        alert('Catégorie invalide.');
        return;
      }
      payload.category = category;
    }

    try {
      const res = await updateOffer(accessToken, offerId, payload);
      if (res.ok) {
        alert('Offre mise à jour !');
        load();
      } else if (res.status === 401) {
        alert('Session expirée, reconnecte-toi.');
        onLogout();
      } else {
        alert('Erreur lors de la mise à jour de l\'offre.');
      }
    } catch {
      alert('Impossible de joindre le serveur. Le backend est-il lancé ?');
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-container">
        <h1>Admin Dashboard</h1>
        <button onClick={onLogout}>Se déconnecter</button>
        <button onClick={handleCreate}>Créer une offre</button>
        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && offers && (
          offers.length === 0
            ? <p>Aucune offre pour le moment.</p>
            : <table className="offers-table">
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>Coût</th>
                <th>Réduction (%)</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer.id}>
                  <td>{offer.partnerName}</td>
                  <td>{offer.cost}</td>
                  <td>{offer.discountPercent}</td>
                  <td>{offer.category}</td>
                  <td>{offer.isActive ? 'Active' : 'Désactivée'}</td>
                  <td>
                    <button onClick={() => handleUpdate(offer.id)}>Modifier</button>
                    {offer.isActive ? (
                      <button onClick={() => handleToggle(offer.id)}>Désactiver</button>
                    ) : (
                      <button onClick={() => handleToggle(offer.id)}>Réactiver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


