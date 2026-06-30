import { useState, useEffect, Fragment } from 'react';
import type { Offer, Category } from '@/types/types';
import Coin from '@/components/ui/Coin';
import Layout from '@/components/layout/Layout';
import BottomNav from '@/components/layout/BottomNav';
import type { NavItem } from '@/hooks/useBottomNav';
import type { NavSection } from '@/components/layout/Sidebar';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import Icon from '@/components/ui/Icon';
import AdminUsers from './AdminUsers';
import AdminCompanies from './AdminCompanies';
import AdminLedgers from './AdminLedgers';
import { useFlash } from '@/hooks/useFlash';
import { useAdminOffers } from '@/hooks/useAdminOffers';
import { useOfferForm } from '@/hooks/useOfferForm';
import { usePromoCodes } from '@/hooks/usePromoCodes';
import { HEADER_BTN_GHOST, HEADER_BTN_ICON, HEADER_BTN_ICON_DANGER } from '@/components/layout/headerButtons';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminCategories from '@/components/admin/AdminCategories';
import OfferImageField from '@/components/admin/OfferImageField';
import { listAdminCategories } from '@/services/api/categories';
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
  ADMIN_FORM_ACTIONS,
  ADMIN_FORM_ERROR,
  ADMIN_MSG,
  ADMIN_TABLE,
  ADMIN_TEXTAREA,
  ADMIN_WRAPPER,
} from './adminClasses';
import EditProfile from '@/components/privacy/EditProfile';
import PrivacySection from '@/components/privacy/PrivacySection';

type AdminPageProps = { onLogout: () => void; onBack: () => void };
type AdminTab = 'overview' | 'companies' | 'offers' | 'codes' | 'users' | 'categories' | 'parametres';

const TAB_META: Record<AdminTab, { title: string; subtitle: string }> = {
  overview:   { title: "Vue d'ensemble",     subtitle: 'Administration plateforme' },
  companies:  { title: 'Entreprises',        subtitle: 'Gestion des sociétés enregistrées' },
  offers:     { title: 'Offres partenaires', subtitle: "Gestion du catalogue d'offres" },
  codes:      { title: 'Transactions',       subtitle: 'Historique des attributions, redemptions et paiements' },
  users:      { title: 'Utilisateurs',       subtitle: 'Comptes et rôles des membres de la plateforme' },
  categories: { title: 'Catégories',         subtitle: "Gestion des catégories d'offres" },
  parametres: { title: 'Paramètres',         subtitle: 'Profil administrateur et confidentialité' },
};

const NAV_PLATEFORME: NavItem[] = [
  { key: 'overview',   label: 'Synthèse',      icon: 'chart',    targetId: 'nav-overview' },
  { key: 'companies',  label: 'Entreprises',   icon: 'building', targetId: 'nav-companies' },
  { key: 'offers',      label: 'Offres',        icon: 'gift',     targetId: 'nav-offers' },
  { key: 'categories', label: 'Catégories',   icon: 'star',     targetId: 'nav-categories' },
  { key: 'codes',      label: 'Transactions',  icon: 'ticket',   targetId: 'nav-codes' },
];

const NAV_GESTION: NavItem[] = [
  { key: 'users',      label: 'Utilisateurs',  icon: 'users',    targetId: 'nav-users' },
  { key: 'parametres', label: 'Paramètres',    icon: 'settings', targetId: 'nav-parametres' },
];

const ADMIN_SECTIONS: NavSection[] = [
  { label: 'Plateforme', items: NAV_PLATEFORME },
  { label: 'Gestion',    items: NAV_GESTION },
];

const ADMIN_NAV_FLAT: NavItem[] = [...NAV_PLATEFORME, ...NAV_GESTION];

// Bottom nav capped at 5 — categories & codes accessible via sidebar on desktop only.
const ADMIN_BOTTOM_NAV_ITEMS: NavItem[] = [
  { key: 'overview',    label: 'Synthèse',     icon: 'chart',    targetId: 'nav-overview' },
  { key: 'companies',   label: 'Entreprises',  icon: 'building', targetId: 'nav-companies' },
  { key: 'offers',      label: 'Offres',       icon: 'gift',     targetId: 'nav-offers' },
  { key: 'users',       label: 'Utilisateurs', icon: 'users',    targetId: 'nav-users' },
  { key: 'parametres',  label: 'Paramètres',   icon: 'settings', targetId: 'nav-parametres' },
];

export default function AdminPage({ onLogout, onBack }: AdminPageProps) {
  const { confirm, confirmDialog } = useConfirm();
  const { notice, flash } = useFlash();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);

  useEffect(() => {
    listAdminCategories()
      .then((res) => { if (res.ok && res.data) setAdminCategories(res.data.categories); })
      .catch(() => {});
  }, []);

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
      title={TAB_META[tab].title}
      subtitle={TAB_META[tab].subtitle}
      nav={{ items: ADMIN_NAV_FLAT, sections: ADMIN_SECTIONS, active: tab, onSelect: (item) => setTab(item.key as AdminTab) }}
      bottomNav={
        <BottomNav items={ADMIN_BOTTOM_NAV_ITEMS} active={tab} onSelect={(item) => setTab(item.key as AdminTab)} />
      }
      sidebarFooter={
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-[10px] bg-white/[.05] px-3 py-2.5">
            <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[8px] bg-[#1A4F4A] text-[12px] font-bold text-[#9FCFCA]">AD</div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-[#D4EEEB]">Administrateur</div>
              <div className="text-[11px] text-[#3D7A74]">Super Admin</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold text-[#6BA8A2] transition hover:bg-white/5 hover:text-primo-error"
          >
            <Icon name="logout" size={16} strokeWidth={1.8} />
            Se déconnecter
          </button>
        </div>
      }
      headerActions={
        <>
          <button className={HEADER_BTN_GHOST} type="button" onClick={onBack}>
             Accueil
          </button>
          <button className={HEADER_BTN_GHOST} type="button" onClick={onLogout}>Se déconnecter</button>
        </>
      }
      headerActionsMobile={
        <>
          <button className={HEADER_BTN_ICON} type="button" onClick={onBack} aria-label="Accueil" title="Accueil">
            <Icon name="home" size={20} strokeWidth={1.8} />
          </button>
          <button className={HEADER_BTN_ICON_DANGER} type="button" onClick={onLogout} aria-label="Se déconnecter" title="Se déconnecter">
            <Icon name="logout" size={20} strokeWidth={1.8} />
          </button>
        </>
      }
    >
    <div className={ADMIN_WRAPPER}>
      <div className={ADMIN_CONTAINER}>
        {notice && <p className={ADMIN_MSG}>{notice}</p>}

        {tab === 'overview' && offers.stats && offers.offers && (
          <AdminOverview
            stats={offers.stats}
            offers={offers.offers}
            onManageCompanies={() => setTab('companies')}
            onManageOffers={() => setTab('offers')}
            onAuthExpired={onLogout}
          />
        )}

        {tab === 'offers' && (
          <div className="rounded-2xl border border-primo-line bg-white p-5 lg:p-6">
            {/* Header row */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-primo-ink">Offres partenaires</h2>
                {offers.offers && (
                  <span className="rounded-full bg-primo-teal-soft px-2.5 py-0.5 text-[12px] font-semibold text-primo-teal-dark">
                    {offers.offers.length}
                  </span>
                )}
              </div>
              {!offerForm.showForm && (
                <button className={ADMIN_BTN_PRIMARY} type="button" onClick={offerForm.openCreate}>+ Nouvelle offre</button>
              )}
            </div>

            {/* Create / Edit form */}
            {offerForm.showForm && (
              <form className="rounded-2xl border border-primo-line bg-white p-5 mb-5" onSubmit={offerForm.submit}>
                <h2 className="text-[15px] font-extrabold text-primo-ink mb-4">{offerForm.editingId ? "Modifier l'offre" : 'Nouvelle offre'}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      value={offerForm.form.categoryId}
                      onChange={(e) => offerForm.setForm({ ...offerForm.form, categoryId: e.target.value })}
                    >
                      <option value="">— Sélectionner une catégorie —</option>
                      {adminCategories.filter((c) => c.isActive !== false).map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4">
                  <OfferImageField
                    currentImageUrl={offerForm.currentImageUrl}
                    onPick={offerForm.pickImage}
                    onClear={offerForm.clearImage}
                  />
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
                <div className="admin-table-responsive rounded-xl border border-primo-line overflow-hidden">
                  <table className={ADMIN_TABLE}>
                    <thead>
                      <tr>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Partenaire</th>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Coût</th>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Réduction</th>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Catégorie</th>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Statut</th>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Codes</th>
                        <th className="bg-primo-teal-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-primo-teal-dark">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.offers.map((offer: Offer) => (
                        <Fragment key={offer.id}>
                          <tr className={offer.isActive ? '' : 'bg-[#fafafb] text-primo-gray'}>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Partenaire">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primo-teal-soft text-primo-teal-dark">
                                  <Icon
                                    size={16}
                                    name={(offer.category?.icon ?? 'gift') as import('@/components/ui/Icon').IconName}
                                  />
                                </span>
                                {offer.partnerName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Coût">
                              <span className="inline-flex items-center gap-1">
                                {offer.cost} <Coin size={16} />
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Réduction">{offer.discountPercent}%</td>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Catégorie">{offer.category?.label ?? '—'}</td>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Statut">
                              <span className={offer.isActive
                                ? 'rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-success-soft text-primo-success'
                                : 'rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-error-soft text-primo-error'
                              }>
                                {offer.isActive ? 'Active' : 'Désactivée'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Codes">
                              <span className="inline-flex items-center gap-1.5">
                                <Icon name="ticket" size={15} />
                                {offer.availableCodes ?? 0} dispo · {offer.usedCodes ?? 0} utilisés
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-primo-ink border-b border-primo-line" data-label="Actions">
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
                                    className={ADMIN_TEXTAREA}
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
          </div>
        )}

        {tab === 'categories' && <AdminCategories flash={flash} />}
        {tab === 'users' && <AdminUsers onFlash={flash} />}
        {tab === 'companies' && <AdminCompanies onFlash={flash} />}
        {tab === 'codes' && <AdminLedgers />}
        {tab === 'parametres' && (
          <>
            <div id="nav-parametres" className="scroll-mt-20" />
            <EditProfile />
            <PrivacySection onAccountDeleted={onLogout} />
            <button
              type="button"
              className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-primo-error-line bg-white px-4 py-3.5 text-[15px] font-bold text-primo-error hover:bg-primo-error-soft lg:hidden"
              onClick={onLogout}
            >
              <Icon name="logout" size={19} /> Se déconnecter
            </button>
          </>
        )}
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
