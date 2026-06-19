import { useState, Fragment } from 'react';
import type { Offer, OfferCategory } from '@/types/types';
import './AdminPage.css';
import Layout from '@/components/layout/Layout';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminUsers from './AdminUsers';
import AdminCompanies from './AdminCompanies';
import AdminLedgers from './AdminLedgers';
import { useFlash } from '@/hooks/useFlash';
import { useAdminOffers } from '@/hooks/useAdminOffers';
import { useOfferForm } from '@/hooks/useOfferForm';
import { usePromoCodes } from '@/hooks/usePromoCodes';

type AdminPageProps = { onLogout: () => void; onBack: () => void };

const CATEGORIES: OfferCategory[] = ['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'];

export default function AdminPage({ onLogout, onBack }: AdminPageProps) {
  const { confirm, confirmDialog } = useConfirm();
  const { notice, flash } = useFlash();
  const [tab, setTab] = useState<'offers' | 'users' | 'companies' | 'ledgers'>('offers');

  const offers = useAdminOffers({ confirm, flash, onAuthExpired: onLogout });
  const offerForm = useOfferForm({ reload: offers.reload, flash });
  const codes = usePromoCodes({
    confirm,
    flash,
    reload: offers.reload,
    setError: offers.setError,
    onAuthExpired: onLogout,
  });

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
        {offers.stats && (
          <div className="admin-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{offers.stats.companies}</span>
              <span className="admin-stat-label">Entreprises</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{offers.stats.users}</span>
              <span className="admin-stat-label">Utilisateurs</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{offers.stats.managers}</span>
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
          {!offerForm.showForm && (
            <button className="admin-btn-primary" type="button" onClick={offerForm.openCreate}>+ Nouvelle offre</button>
          )}
        </div>
        {offerForm.showForm && (
          <form className="admin-form" onSubmit={offerForm.submit}>
            <h2 className="admin-form-title">{offerForm.editingId ? "Modifier l'offre" : 'Nouvelle offre'}</h2>
            <div className="admin-form-grid">
              <label>
                Partenaire
                <input
                  type="text"
                  value={offerForm.form.partnerName}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, partnerName: e.target.value })}
                  placeholder="Ex. Cinéma Pathé"
                />
              </label>
              <label>
                Coût (points)
                <input
                  type="number"
                  min={0}
                  value={offerForm.form.cost}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, cost: e.target.value })}
                />
              </label>
              <label>
                Réduction (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={offerForm.form.discountPercent}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, discountPercent: e.target.value })}
                />
              </label>
              <label>
                Catégorie
                <select
                  value={offerForm.form.category}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, category: e.target.value as OfferCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            {offerForm.formError && <p className="admin-form-error">{offerForm.formError}</p>}
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary" disabled={offerForm.saving}>
                {offerForm.saving ? 'Enregistrement…' : offerForm.editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" className="admin-btn-ghost" onClick={offerForm.closeForm}>Annuler</button>
            </div>
          </form>
        )}

        {offers.loading && <p className="admin-msg">Chargement…</p>}
        {offers.error && <p className="admin-msg admin-error">{offers.error}</p>}

        {!offers.loading && offers.offers && (
          offers.offers.length === 0 ? (
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
                {offers.offers.map((offer: Offer) => (
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
                      <button className="admin-btn-link" onClick={() => offerForm.openEdit(offer)}>Modifier</button>
                      <button className="admin-btn-link" onClick={() => offers.toggleActive(offer)}>
                        {offer.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                      <button className="admin-btn-link" onClick={() => codes.toggle(offer.id)}>
                        {codes.openId === offer.id ? 'Fermer' : 'Gérer les codes'}
                      </button>
                    </td>
                  </tr>
                  {codes.openId === offer.id && (
                    <tr className="admin-codes-row">
                      <td colSpan={7}>
                        <div className="admin-codes-panel">
                          <textarea
                            rows={5}
                            value={codes.text}
                            onChange={(e) => codes.setText(e.target.value)}
                            placeholder={'AMZN-XXXX-1111\nAMZN-XXXX-2222\n...'}
                          />
                          {codes.error && <p className="admin-error">{codes.error}</p>}
                          <input
                            ref={codes.csvInputRef}
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            style={{ display: 'none' }}
                            onChange={codes.handleCsvFile}
                          />
                          <div className="admin-codes-actions">
                            <button
                              type="button"
                              className="admin-btn-ghost"
                              onClick={() => codes.csvInputRef.current?.click()}
                            >
                              📄 Importer un CSV
                            </button>
                            <button
                              type="button"
                              className="admin-btn-primary"
                              disabled={codes.submitting}
                              onClick={() => codes.addCodes(offer)}
                            >
                              {codes.submitting ? '…' : 'Ajouter les codes'}
                            </button>
                          </div>

                          <div className="admin-codes-list">
                            {codes.listLoading ? (
                              <p className="admin-msg">Chargement des codes…</p>
                            ) : codes.list && codes.list.length > 0 ? (
                              <ul>
                                {codes.list.map((c) => (
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
                                          onClick={() => codes.deleteCode(c.id)}
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
