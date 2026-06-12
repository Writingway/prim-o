import { useEffect, useState } from 'react';
import { listOffers, createOffer, updateOffer, deactivateOffer } from '../services/api';
import type { Offer, OfferCategory } from '../types/types';
import './AdminPage.css';
import Layout from '../components/layout/Layout';

type AdminPageProps = { onLogout: () => void; onBack: () => void };

const CATEGORIES: OfferCategory[] = ['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'];

// Form vide pour une nouvelle offre.
const emptyForm = { partnerName: '', cost: '', discountPercent: '', category: 'FOOD' as OfferCategory };

export default function AdminPage({ onLogout, onBack }: AdminPageProps) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Form : panneau de création/édition. editingId === null → création.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Message de confirmation transitoire (remplace les alert()).
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listOffers();
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

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      partnerName: offer.partnerName,
      cost: String(offer.cost),
      discountPercent: String(offer.discountPercent),
      category: offer.category,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const cost = Number(form.cost);
    const discountPercent = Number(form.discountPercent);
    if (!form.partnerName.trim()) return setFormError('Le nom du partenaire est requis.');
    if (isNaN(cost) || cost < 0) return setFormError('Coût invalide.');
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100)
      return setFormError('Réduction invalide (0-100).');

    setSaving(true);
    try {
      const payload = {
        partnerName: form.partnerName.trim(),
        cost,
        discountPercent,
        category: form.category,
      };
      const res = editingId
        ? await updateOffer(editingId, payload)
        : await createOffer(payload);

      if (res.ok) {
        flash(editingId ? 'Offre mise à jour.' : 'Offre créée.');
        closeForm();
        load();
      } else if (res.status === 401) {
        setFormError('Session expirée, reconnecte-toi.');
      } else {
        setFormError("Erreur lors de l'enregistrement de l'offre.");
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (offer: Offer) => {
    try {
      // Désactivation = soft delete dédié ; réactivation = update isActive.
      const res = offer.isActive
        ? await deactivateOffer(offer.id)
        : await updateOffer(offer.id, { isActive: true });
      if (res.ok) {
        flash(offer.isActive ? 'Offre désactivée.' : 'Offre réactivée.');
        load();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        onLogout();
      } else {
        setError("Erreur lors de la mise à jour de l'offre.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  return (
    <Layout
      title="Admin · Offres"
      headerActions={
        <>
          <button className="app-btn app-btn-primary" type="button" onClick={openCreate}>+ Nouvelle offre</button>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>
            ← Accueil
          </button>
          <button className="app-btn app-btn-ghost" type="button" onClick={onLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className="admin-wrapper">
      <div className="admin-container">
        {notice && <p className="admin-notice">{notice}</p>}

        {showForm && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <h2 className="admin-form-title">{editingId ? "Modifier l'offre" : 'Nouvelle offre'}</h2>
            <div className="admin-form-grid">
              <label>
                Partenaire
                <input
                  type="text"
                  value={form.partnerName}
                  onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
                  placeholder="Ex. Cinéma Pathé"
                />
              </label>
              <label>
                Coût (points)
                <input
                  type="number"
                  min={0}
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </label>
              <label>
                Réduction (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                />
              </label>
              <label>
                Catégorie
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as OfferCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            {formError && <p className="admin-form-error">{formError}</p>}
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" className="admin-btn-ghost" onClick={closeForm}>Annuler</button>
            </div>
          </form>
        )}

        {loading && <p className="admin-msg">Chargement…</p>}
        {error && <p className="admin-msg admin-error">{error}</p>}

        {!loading && offers && (
          offers.length === 0 ? (
            <p className="admin-msg">Aucune offre pour le moment.</p>
          ) : (
            <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Coût</th>
                  <th>Réduction</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id} className={offer.isActive ? '' : 'admin-row-inactive'}>
                    <td>{offer.partnerName}</td>
                    <td>{offer.cost}</td>
                    <td>{offer.discountPercent}%</td>
                    <td>{offer.category}</td>
                    <td>
                      <span className={`admin-badge ${offer.isActive ? 'active' : 'inactive'}`}>
                        {offer.isActive ? 'Active' : 'Désactivée'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button className="admin-btn-link" onClick={() => openEdit(offer)}>Modifier</button>
                      <button className="admin-btn-link" onClick={() => handleToggle(offer)}>
                        {offer.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )
        )}
      </div>
    </div>
    </Layout>
  );
}
