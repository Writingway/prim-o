import { useEffect, useState, useRef, Fragment } from 'react';
import { 
  listOffers,
  createOffer,
  updateOffer,
  deactivateOffer,
  getAdminStats,
  addPromoCodes,
  listPromoCodes,
  deletePromoCode
} from '../services/api';
import type { AdminPromoCode } from '../services/api';
import type { Offer, OfferCategory, AdminStats } from '../types/types';
import './AdminPage.css';
import Layout from '../components/layout/Layout';
import { useConfirm } from '../components/ui/ConfirmDialog';
import AdminUsers from './AdminUsers';
import AdminCompanies from './AdminCompanies';
import AdminLedgers from './AdminLedgers';

type AdminPageProps = { onLogout: () => void; onBack: () => void };

const CATEGORIES: OfferCategory[] = ['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'];

// Form vide pour une nouvelle offre.
const emptyForm = { partnerName: '', cost: '', discountPercent: '', category: 'FOOD' as OfferCategory };

export default function AdminPage({ onLogout, onBack }: AdminPageProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [tab, setTab] = useState<'offers' | 'users' | 'companies' | 'ledgers'>('offers');
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
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

  // Panneau « Gérer les codes » : ouvert pour une offre à la fois.
  const [codesOpenId, setCodesOpenId] = useState<string | null>(null);
  const [codesText, setCodesText] = useState('');
  const [codesError, setCodesError] = useState('');
  const [codesSubmitting, setCodesSubmitting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  // Liste des codes de l'offre ouverte (lecture).
  const [codesList, setCodesList] = useState<AdminPromoCode[] | null>(null);
  const [codesListLoading, setCodesListLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [offersRes, statsRes] = await Promise.all([listOffers(), getAdminStats()]);
      if (offersRes.ok && offersRes.data) {
        setOffers(offersRes.data.offers);
      } else if (offersRes.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger les offres.');
      }
      if (statsRes.ok && statsRes.data) setStats(statsRes.data);
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
    const ok = await confirm({
      title: offer.isActive ? 'Désactiver cette offre ?' : 'Réactiver cette offre ?',
      message: offer.isActive
        ? `Désactiver « ${offer.partnerName} » ? Elle ne sera plus visible.`
        : `Réactiver « ${offer.partnerName} » ?`,
      confirmLabel: offer.isActive ? 'Désactiver' : 'Réactiver',
      danger: offer.isActive,
    });
    if (!ok) return;
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

  const toggleCodes = async (offerId: string) => {
    const opening = codesOpenId !== offerId;
    setCodesOpenId(opening ? offerId : null);
    setCodesText('');
    setCodesError('');
    setCodesList(null);
    if (opening) {
      setCodesListLoading(true);
      try {
        const res = await listPromoCodes(offerId);
        if (res.ok && res.data) setCodesList(res.data.codes);
      } finally {
        setCodesListLoading(false);
      }
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    setCodesError('');
    const ok = await confirm({
      title: 'Supprimer ce code ?',
      message: 'Ce code disponible sera définitivement supprimé.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    const res = await deletePromoCode(codeId);
    if (res.ok) {
      flash('Code supprimé.');
      load(); // rafraîchit les compteurs de stock
    } else if (res.status === 409) {
      setCodesError('Ce code a déjà été utilisé, impossible de le supprimer.');
    } else {
      setCodesError('Impossible de supprimer ce code.');
    }
    // Dans tous les cas, on resynchronise la liste affichée.
    if (codesOpenId) {
      const r = await listPromoCodes(codesOpenId);
      if (r.ok && r.data) setCodesList(r.data.codes);
    }
  };

  // Lit un fichier CSV côté navigateur et remplit le textarea avec les codes
  // (un par ligne). On gère le séparateur ligne ET virgule, et on ignore une
  // éventuelle ligne d'en-tête « code ».
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodesError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const codes = raw
        .split(/[\r\n,;]+/)        // lignes, virgules ou points-virgules
        .map((c) => c.trim())
        .filter((c) => c.length > 0 && c.toLowerCase() !== 'code'); // saute l'en-tête éventuel
      if (codes.length === 0) {
        setCodesError('Aucun code trouvé dans le fichier.');
      } else {
        setCodesText(codes.join('\n')); // l'admin vérifie avant d'ajouter
      }
    };
    reader.onerror = () => setCodesError('Impossible de lire le fichier.');
    reader.readAsText(file);
    e.target.value = ''; // permet de re-sélectionner le même fichier
  };

  const handleAddCodes = async (offer: Offer) => {
    setCodesError('');
    // Découpe sur retour à la ligne, virgule ou point-virgule (même logique que le CSV).
    const codes = codesText
      .split(/[\r\n,;]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (codes.length === 0) {
      setCodesError('Colle au moins un code (un par ligne).');
      return;
    }
    setCodesSubmitting(true);
    try {
      const res = await addPromoCodes(offer.id, codes);
      if (res.ok && res.data) {
        flash(`✅ ${res.data.added} code(s) ajouté(s), ${res.data.skipped} ignoré(s).`);
        setCodesText('');
        setCodesOpenId(null);
        load(); // rafraîchit le badge de stock
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        onLogout();
      } else if (res.status === 404) {
        setCodesError('Offre introuvable.');
      } else {
        setCodesError("Impossible d'ajouter les codes.");
      }
    } catch {
      setCodesError('Impossible de joindre le serveur.');
    } finally {
      setCodesSubmitting(false);
    }
  };

  return (
    <Layout
      title="Admin"
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>
             Accueil
          </button>
          <button className="app-btn app-btn-ghost" type="button" onClick={onLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className="admin-wrapper">
      <div className="admin-container">
        {stats && (
          <div className="admin-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.companies}</span>
              <span className="admin-stat-label">Entreprises</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.users}</span>
              <span className="admin-stat-label">Utilisateurs</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.managers}</span>
              <span className="admin-stat-label">Managers</span>
            </div>
          </div>
        )}

        {notice && <p className="admin-notice">{notice}</p>}

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${tab === 'offers' ? 'active' : ''}`}
            onClick={() => setTab('offers')}
          >
            Offres
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Utilisateurs
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === 'companies' ? 'active' : ''}`}
            onClick={() => setTab('companies')}
          >
            Entreprises
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === 'ledgers' ? 'active' : ''}`}
            onClick={() => setTab('ledgers')}
          >
            Registres
          </button>
        </div>

        {tab === 'offers' && (
          <>
        <div className="admin-offers-bar">
          <h2 className="admin-section-title">Offres</h2>
          {!showForm && (
            <button className="admin-btn-primary" type="button" onClick={openCreate}>+ Nouvelle offre</button>
          )}
        </div>
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
                  <th>Codes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <Fragment key={offer.id}>
                  <tr className={offer.isActive ? '' : 'admin-row-inactive'}>
                    <td data-label="Partenaire">{offer.partnerName}</td>
                    <td data-label="Coût">{offer.cost}</td>
                    <td data-label="Réduction">{offer.discountPercent}%</td>
                    <td data-label="Catégorie">{offer.category}</td>
                    <td data-label="Statut">
                      <span className={`admin-badge ${offer.isActive ? 'active' : 'inactive'}`}>
                        {offer.isActive ? 'Active' : 'Désactivée'}
                      </span>
                    </td>
                    <td data-label="Codes">
                      🎟️ {offer.availableCodes ?? 0} dispo · {offer.usedCodes ?? 0} utilisés
                    </td>
                    <td className="admin-actions" data-label="Actions">
                      <button className="admin-btn-link" onClick={() => openEdit(offer)}>Modifier</button>
                      <button className="admin-btn-link" onClick={() => handleToggle(offer)}>
                        {offer.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                      <button className="admin-btn-link" onClick={() => toggleCodes(offer.id)}>
                        {codesOpenId === offer.id ? 'Fermer' : 'Gérer les codes'}
                      </button>
                    </td>
                  </tr>
                  {codesOpenId === offer.id && (
                    <tr className="admin-codes-row">
                      <td colSpan={7}>
                        <div className="admin-codes-panel">
                          <textarea
                            rows={5}
                            value={codesText}
                            onChange={(e) => setCodesText(e.target.value)}
                            placeholder={'AMZN-XXXX-1111\nAMZN-XXXX-2222\n...'}
                          />
                          {codesError && <p className="admin-error">{codesError}</p>}
                          <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            style={{ display: 'none' }}
                            onChange={handleCsvFile}
                          />
                          <div className="admin-codes-actions">
                            <button
                              type="button"
                              className="admin-btn-ghost"
                              onClick={() => csvInputRef.current?.click()}
                            >
                              📄 Importer un CSV
                            </button>
                            <button
                              type="button"
                              className="admin-btn-primary"
                              disabled={codesSubmitting}
                              onClick={() => handleAddCodes(offer)}
                            >
                              {codesSubmitting ? '…' : 'Ajouter les codes'}
                            </button>
                          </div>

                          <div className="admin-codes-list">
                            {codesListLoading ? (
                              <p className="admin-msg">Chargement des codes…</p>
                            ) : codesList && codesList.length > 0 ? (
                              <ul>
                                {codesList.map((c) => (
                                  <li key={c.id}>
                                    <code>{c.code}</code>{' '}
                                    {c.isUsed ? (
                                      <span className="admin-badge inactive">
                                        utilisé{c.usedAt ? ` le ${new Date(c.usedAt).toLocaleDateString('fr-FR')}` : ''}
                                      </span>
                                    ) : (
                                      <>
                                        <span className="admin-badge active">dispo</span>
                                        <button
                                          type="button"
                                          className="admin-btn-link"
                                          title="Supprimer ce code"
                                          onClick={() => handleDeleteCode(c.id)}
                                        >
                                          🗑️
                                        </button>
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="admin-msg">Aucun code pour cette offre.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            </div>
          )
        )}
          </>
        )}

        {tab === 'users' && <AdminUsers onFlash={flash} />}
        {tab === 'companies' && <AdminCompanies onFlash={flash} />}
        {tab === 'ledgers' && <AdminLedgers />}
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
