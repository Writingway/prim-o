import { useState, Fragment } from 'react';
import type { Offer, OfferCategory } from '@/types/types';
import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import type { NavItem } from '@/hooks/useBottomNav';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import Icon from '@/components/ui/Icon';
import AdminUsers from './AdminUsers';
import AdminCompanies from './AdminCompanies';
import AdminLedgers from './AdminLedgers';
import { useFlash } from '@/hooks/useFlash';
import { useAdminOffers } from '@/hooks/useAdminOffers';
import { useOfferForm } from '@/hooks/useOfferForm';
import { usePromoCodes } from '@/hooks/usePromoCodes';
import { HEADER_BTN_GHOST } from '@/components/layout/headerButtons';
import {
  ADMIN_ACTIONS,
  ADMIN_BADGE_ACTIVE,
  ADMIN_BADGE_INACTIVE,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LINK,
  ADMIN_BTN_PRIMARY,
  ADMIN_CODES_ACTIONS,
  ADMIN_CODES_LIST,
  ADMIN_CODES_ITEM,
  ADMIN_CODES_LIST_UL,
  ADMIN_CODES_PANEL,
  ADMIN_CODES_ROW,
  ADMIN_CODE,
  ADMIN_CONTAINER,
  ADMIN_ERROR,
  ADMIN_FORM,
  ADMIN_FORM_ACTIONS,
  ADMIN_FORM_ERROR,
  ADMIN_FORM_GRID,
  ADMIN_FORM_TITLE,
  ADMIN_MSG,
  ADMIN_OFFERS_BAR,
  ADMIN_SECTION_TITLE,
  ADMIN_TAB,
  ADMIN_TAB_ACTIVE,
  ADMIN_TABLE,
  ADMIN_TABLE_SCROLL,
  ADMIN_TD,
  ADMIN_TH,
  ADMIN_TABS,
  ADMIN_WRAPPER,
  ADMIN_STATS,
  ADMIN_STAT_CARD,
  ADMIN_STAT_LABEL,
  ADMIN_STAT_VALUE,
} from './adminClasses';

type AdminPageProps = { onLogout: () => void; onBack: () => void };
type AdminTab = 'offers' | 'users' | 'companies' | 'ledgers';

const CATEGORIES: OfferCategory[] = ['FOOD', 'SHOPPING', 'CULTURE', 'TRAVEL', 'WELLNESS', 'OTHER'];

// Onglets admin → items de navigation (icônes linéaires valides uniquement).
// `targetId` n'est pas utilisé ici (pas de scroll-spy), valeur neutre.
const ADMIN_NAV: NavItem[] = [
  { key: 'offers', label: 'Offres', icon: 'gift', targetId: 'nav-offers' },
  { key: 'users', label: 'Utilisateurs', icon: 'users', targetId: 'nav-users' },
  { key: 'companies', label: 'Entreprises', icon: 'building', targetId: 'nav-companies' },
  { key: 'ledgers', label: 'Registres', icon: 'chart', targetId: 'nav-ledgers' },
];

export default function AdminPage({ onLogout, onBack }: AdminPageProps) {
  const { confirm, confirmDialog } = useConfirm();
  const { notice, flash } = useFlash();
  const [tab, setTab] = useState<AdminTab>('offers');

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
      chrome="console"
      title="Administration"
      subtitle="Console"
      nav={{ items: ADMIN_NAV, active: tab, onSelect: (item) => setTab(item.key as AdminTab) }}
      bottomNav={
        <BottomNav items={ADMIN_NAV} active={tab} onSelect={(item) => setTab(item.key as AdminTab)} />
      }
      headerActions={
        <>
          <button className={HEADER_BTN_GHOST} type="button" onClick={onBack}>
             Accueil
          </button>
          <button className={HEADER_BTN_GHOST} type="button" onClick={onLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className={ADMIN_WRAPPER}>
      <div className={ADMIN_CONTAINER}>
        {offers.stats && (
          <div className={ADMIN_STATS}>
            <div className={ADMIN_STAT_CARD}>
              <span className={ADMIN_STAT_VALUE}>{offers.stats.companies}</span>
              <span className={ADMIN_STAT_LABEL}>Entreprises</span>
            </div>
            <div className={ADMIN_STAT_CARD}>
              <span className={ADMIN_STAT_VALUE}>{offers.stats.users}</span>
              <span className={ADMIN_STAT_LABEL}>Utilisateurs</span>
            </div>
            <div className={ADMIN_STAT_CARD}>
              <span className={ADMIN_STAT_VALUE}>{offers.stats.managers}</span>
              <span className={ADMIN_STAT_LABEL}>Managers</span>
            </div>
          </div>
        )}

        {notice && <p className={ADMIN_MSG}>{notice}</p>}

        <div className={`${ADMIN_TABS} lg:hidden`}>
          <button
            type="button"
            className={`${ADMIN_TAB} ${tab === 'offers' ? ADMIN_TAB_ACTIVE : ''}`}
            onClick={() => setTab('offers')}
          >
            Offres
          </button>
          <button
            type="button"
            className={`${ADMIN_TAB} ${tab === 'users' ? ADMIN_TAB_ACTIVE : ''}`}
            onClick={() => setTab('users')}
          >
            Utilisateurs
          </button>
          <button
            type="button"
            className={`${ADMIN_TAB} ${tab === 'companies' ? ADMIN_TAB_ACTIVE : ''}`}
            onClick={() => setTab('companies')}
          >
            Entreprises
          </button>
          <button
            type="button"
            className={`${ADMIN_TAB} ${tab === 'ledgers' ? ADMIN_TAB_ACTIVE : ''}`}
            onClick={() => setTab('ledgers')}
          >
            Registres
          </button>
        </div>

        {tab === 'offers' && (
          <>
        <div className={ADMIN_OFFERS_BAR}>
          <h2 className={ADMIN_SECTION_TITLE}>Offres</h2>
          {!offerForm.showForm && (
            <button className={ADMIN_BTN_PRIMARY} type="button" onClick={offerForm.openCreate}>+ Nouvelle offre</button>
          )}
        </div>
        {offerForm.showForm && (
          <form className={ADMIN_FORM} onSubmit={offerForm.submit}>
            <h2 className={ADMIN_FORM_TITLE}>{offerForm.editingId ? "Modifier l'offre" : 'Nouvelle offre'}</h2>
            <div className={ADMIN_FORM_GRID}>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
                Partenaire
                <input
                  className="w-full rounded-lg border border-[#d1d5db] bg-primo-bg px-3 py-[9px] text-sm text-[#1f2937] outline-none transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]"
                  type="text"
                  value={offerForm.form.partnerName}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, partnerName: e.target.value })}
                  placeholder="Ex. Cinéma Pathé"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
                Coût (points)
                <input
                  className="w-full rounded-lg border border-[#d1d5db] bg-primo-bg px-3 py-[9px] text-sm text-[#1f2937] outline-none transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]"
                  type="number"
                  min={0}
                  value={offerForm.form.cost}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, cost: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
                Réduction (%)
                <input
                  className="w-full rounded-lg border border-[#d1d5db] bg-primo-bg px-3 py-[9px] text-sm text-[#1f2937] outline-none transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]"
                  type="number"
                  min={0}
                  max={100}
                  value={offerForm.form.discountPercent}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, discountPercent: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
                Catégorie
                <select
                  className="w-full rounded-lg border border-[#d1d5db] bg-primo-bg px-3 py-[9px] text-sm text-[#1f2937] outline-none transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]"
                  value={offerForm.form.category}
                  onChange={(e) => offerForm.setForm({ ...offerForm.form, category: e.target.value as OfferCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            {offerForm.formError && <p className={ADMIN_FORM_ERROR}>{offerForm.formError}</p>}
            <div className={ADMIN_FORM_ACTIONS}>
              <button type="submit" className={ADMIN_BTN_PRIMARY} disabled={offerForm.saving}>
                {offerForm.saving ? 'Enregistrement…' : offerForm.editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" className={ADMIN_BTN_GHOST} onClick={offerForm.closeForm}>Annuler</button>
            </div>
          </form>
        )}

        {offers.loading && <p className={ADMIN_MSG}>Chargement…</p>}
        {offers.error && <p className={`${ADMIN_MSG} ${ADMIN_ERROR}`}>{offers.error}</p>}

        {!offers.loading && offers.offers && (
          offers.offers.length === 0 ? (
            <p className={ADMIN_MSG}>Aucune offre pour le moment.</p>
          ) : (
            <div className={ADMIN_TABLE_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead>
                <tr>
                  <th className={ADMIN_TH}>Partenaire</th>
                  <th className={ADMIN_TH}>Coût</th>
                  <th className={ADMIN_TH}>Réduction</th>
                  <th className={ADMIN_TH}>Catégorie</th>
                  <th className={ADMIN_TH}>Statut</th>
                  <th className={ADMIN_TH}>Codes</th>
                  <th className={ADMIN_TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.offers.map((offer: Offer) => (
                  <Fragment key={offer.id}>
                  <tr className={offer.isActive ? '' : 'bg-[#fafafb] text-primo-gray'}>
                    <td className={ADMIN_TD} data-label="Partenaire">{offer.partnerName}</td>
                    <td className={ADMIN_TD} data-label="Coût">{offer.cost}</td>
                    <td className={ADMIN_TD} data-label="Réduction">{offer.discountPercent}%</td>
                    <td className={ADMIN_TD} data-label="Catégorie">{offer.category}</td>
                    <td className={ADMIN_TD} data-label="Statut">
                      <span className={offer.isActive ? ADMIN_BADGE_ACTIVE : ADMIN_BADGE_INACTIVE}>
                        {offer.isActive ? 'Active' : 'Désactivée'}
                      </span>
                    </td>
                    <td className={ADMIN_TD} data-label="Codes">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="ticket" size={15} />
                        {offer.availableCodes ?? 0} dispo · {offer.usedCodes ?? 0} utilisés
                      </span>
                    </td>
                    <td className={ADMIN_TD} data-label="Actions">
                      <div className={ADMIN_ACTIONS}>
                      <button className={ADMIN_BTN_LINK} onClick={() => offerForm.openEdit(offer)}>Modifier</button>
                      <button className={ADMIN_BTN_LINK} onClick={() => offers.toggleActive(offer)}>
                        {offer.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                      <button className={ADMIN_BTN_LINK} onClick={() => codes.toggle(offer.id)}>
                        {codes.openId === offer.id ? 'Fermer' : 'Gérer les codes'}
                      </button>
                      </div>
                    </td>
                  </tr>
                  {codes.openId === offer.id && (
                    <tr className={ADMIN_CODES_ROW}>
                      <td colSpan={7}>
                        <div className={ADMIN_CODES_PANEL}>
                          <textarea
                            rows={5}
                            value={codes.text}
                            onChange={(e) => codes.setText(e.target.value)}
                            placeholder={'AMZN-XXXX-1111\nAMZN-XXXX-2222\n...'}
                            className="w-full resize-y rounded-lg border border-[#d1d5db] bg-primo-bg px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]"
                          />
                          {codes.error && <p className={ADMIN_ERROR}>{codes.error}</p>}
                          <input
                            ref={codes.csvInputRef}
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            style={{ display: 'none' }}
                            onChange={codes.handleCsvFile}
                          />
                          <div className={ADMIN_CODES_ACTIONS}>
                            <button
                              type="button"
                              className={ADMIN_BTN_GHOST}
                              onClick={() => codes.csvInputRef.current?.click()}
                            >
                              <Icon name="copy" size={16} /> Importer un CSV
                            </button>
                            <button
                              type="button"
                              className={ADMIN_BTN_PRIMARY}
                              disabled={codes.submitting}
                              onClick={() => codes.addCodes(offer)}
                            >
                              {codes.submitting ? '…' : 'Ajouter les codes'}
                            </button>
                          </div>

                          <div className={ADMIN_CODES_LIST}>
                            {codes.listLoading ? (
                              <p className={ADMIN_MSG}>Chargement des codes…</p>
                            ) : codes.list && codes.list.length > 0 ? (
                              <ul className={ADMIN_CODES_LIST_UL}>
                                {codes.list.map((c) => (
                                  <li key={c.id} className={ADMIN_CODES_ITEM}>
                                    <code className={ADMIN_CODE}>{c.code}</code>{' '}
                                    {c.isUsed ? (
                                      <span className={ADMIN_BADGE_INACTIVE}>
                                        utilisé{c.usedAt ? ` le ${new Date(c.usedAt).toLocaleDateString('fr-FR')}` : ''}
                                      </span>
                                    ) : (
                                      <>
                                        <span className={ADMIN_BADGE_ACTIVE}>dispo</span>
                                        <button
                                          type="button"
                                          className={ADMIN_BTN_LINK}
                                          title="Supprimer ce code"
                                          aria-label="Supprimer ce code"
                                          onClick={() => codes.deleteCode(c.id)}
                                        >
                                          <Icon name="trash" size={15} />
                                        </button>
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className={ADMIN_MSG}>Aucun code pour cette offre.</p>
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
