import { useEffect, useState } from 'react';
import {
  listEmployees,
  getCompany,
  listAttributions,
  deleteEmployee,
  generateInviteCode,
  approveEmployee as apiApproveEmployee,
  listMotifs,
  listEnvelopes,
  getManagerBalances,
  logout as apiLogout,
} from '../services/api';
import type { Employee, Company, AttributionHistory } from '../types/types';
import type { MotifCategoryGroup, ManagerEnvelope, ManagerBalances } from '../types/types';
import { formatDate } from '../lib/format';
import Layout from '../components/layout/Layout';
import BottomNav from '../components/layout/BottomNav';
import { NAV_ITEMS } from '../hooks/useBottomNav';
import PrivacySection from '../components/privacy/PrivacySection';
import EditProfile from '../components/privacy/EditProfile';
import { useConfirm } from '../components/ui/ConfirmDialog';
import EnvelopeTile from '../components/allocation/EnvelopeTile';
import RedistributionBlock from '../components/allocation/RedistributionBlock';
import OfferCatalog from '../components/offers/OfferCatalog';
import MyPromoCodes from '../components/offers/MyPromoCodes';
import DashHistory from '../components/dashboard/DashHistory';
import Icon from '../components/ui/Icon';
import Coin from '../components/ui/Coin';
import DashboardHero from '../components/dashboard/DashboardHero';
import Avatar from '../components/dashboard/Avatar';
import {
  DASH_WRAPPER, DASH_CONTAINER, DASH_INVITE,
  DASH_MSG, DASH_ERROR, DASH_RETRY, HISTORY, HISTORY_TITLE, ENV_GRID,
  EMP_LIST, EMP_ITEM, EMP_ROW, EMP_MAIN, EMP_NAME, EMP_BADGE, EMP_BADGE_VERIFIED,
  EMP_ATTRIB_BTN, EMP_SUB, EMP_BALANCE, EMP_BALANCE_NUM, EMP_BALANCE_LABEL, EMP_DELETE_BTN,
} from '../components/dashboard/dashStyles';

type Props = { onLogout: () => void; onBack: () => void; firstName?: string | null; profilePhoto?: string | null };

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

// Manager dashboard: opens received envelopes and redistributes them to employees.
// (Managers no longer distribute directly: everything goes through envelopes.)
export default function ManagerDashboard({ onLogout, firstName, profilePhoto }: Props) {
  const { confirm, confirmDialog } = useConfirm();
  // Hero avatar photo, updated live when the user saves it in the Profil tab.
  const [heroPhoto, setHeroPhoto] = useState<string | null>(profilePhoto ?? null);
  const heroInitials = (firstName?.[0] ?? '?').toUpperCase();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [attributions, setAttributions] = useState<AttributionHistory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  const [activeTab, setActiveTab] =
    useState<'enveloppes' | 'offres' | 'codes' | 'employes' | 'profil'>('employes');
  const [envView, setEnvView] = useState<'recues' | 'ouvertes'>('recues');
  const [motifGroups, setMotifGroups] = useState<MotifCategoryGroup[]>([]);
  const [envelopes, setEnvelopes] = useState<ManagerEnvelope[]>([]);
  const [balances, setBalances] = useState<ManagerBalances | null>(null);
  const [openEnvelope, setOpenEnvelope] = useState<ManagerEnvelope | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, compRes, attrRes, motifRes] = await Promise.all([
        listEmployees(),
        getCompany(),
        listAttributions(),
        listMotifs(),
      ]);

      if (empRes.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        return;
      }
      if (!empRes.ok || !empRes.data) {
        setError('Impossible de charger les employés.');
        return;
      }

      setEmployees(empRes.data.employees);
      if (compRes.ok && compRes.data) setCompany(compRes.data.company);
      if (attrRes.ok && attrRes.data) setAttributions(attrRes.data.attributions);
      if (motifRes.ok && motifRes.data) setMotifGroups(motifRes.data.categories);

      const [envRes, balRes] = await Promise.all([listEnvelopes(), getManagerBalances()]);
      if (envRes.ok && envRes.data) setEnvelopes(envRes.data.envelopes);
      if (balRes.ok && balRes.data) setBalances(balRes.data);
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    }, []);

  const handleDelete = async (e: Employee) => {
    const ok = await confirm({
      title: 'Supprimer cet employé ?',
      message: `Supprimer ${e.firstName} ${e.lastName} ? Son historique est conservé.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(e.id);
    try {
      const res = await deleteEmployee(e.id);
      if (res.ok) await load();
      else setError("Impossible de supprimer cet employé.");
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Log out on the frontend even if the API call fails.
    }
    onLogout();
  };

  const handleGenerateInvite = async () => {
    setInviteError('');
    try {
      const res = await generateInviteCode('EMPLOYEE');
      if (res.ok && res.data?.invite) setInviteCode(res.data.invite.code);
      else if (res.status === 401) setInviteError('Session expirée, reconnecte-toi.');
      else setInviteError("Impossible de générer le code d'invitation.");
    } catch {
      setInviteError('Impossible de joindre le serveur.');
    }
  };

  const approveEmployee = async (employeeId: string) => {
    try {
      const res = await apiApproveEmployee(employeeId);
      if (res.ok) await load();
      else if (res.status === 401) setError('Session expirée, reconnecte-toi.');
      else setError("Impossible d'approuver cet employé.");
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  const onEnvelopeDistributed = async () => {
    setOpenEnvelope(null);
    await load();
  };

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  const loader = <p className={DASH_MSG}>Chargement…</p>;
  const errorNote = (
    <div className={`${DASH_MSG} ${DASH_ERROR}`}>
      {error}{' '}
      <button type="button" className={DASH_RETRY} onClick={load}>Réessayer</button>
    </div>
  );

  return (
    <Layout
      title="Prim'O — Espace manager"
      chrome="console"
      hideConsoleMobileHeader
      hideConsoleTopbar
      nav={{
        items: NAV_ITEMS.manager,
        active: activeTab,
        onSelect: (it) => setActiveTab(it.key as typeof activeTab),
      }}
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.manager}
          active={activeTab}
          onSelect={(it) => setActiveTab(it.key as typeof activeTab)}
        />
      }
      sidebarFooter={
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold text-[#6BA8A2] transition hover:bg-white/5 hover:text-primo-error"
        >
          <Icon name="logout" size={16} strokeWidth={1.8} /> Se déconnecter
        </button>
      }
    >
    <div className={DASH_WRAPPER}>
      <div className={DASH_CONTAINER}>

        {(activeTab === 'employes' ) && (
          <>
            {/* Hero (see README D1); the envelope count doubles as a shortcut to the Enveloppes tab. */}
            <DashboardHero
              bleed="-mx-4"
              eyebrow="Espace manager"
              title={company?.name ?? 'Mon équipe'}
              photo={heroPhoto}
              initials={heroInitials}
            >
              <button
                type="button"
                onClick={() => setActiveTab('enveloppes')}
                className="mt-5 block w-full rounded-2xl border border-white/10 bg-white/[0.09] p-4 text-left transition hover:bg-white/[0.14]"
              >

                <div className="flex items-end gap-2.5">
                  <Icon name="envelope" size={34} />
                  <span className="text-[42px] font-extrabold leading-none tracking-[-0.03em]">
                    {envelopes.filter((e) => e.status === 'A_DISTRIBUER').length}
                  </span>
                </div>
              </button>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.06] p-3.5">
                  <div className="text-xs text-white/65">Mon solde perso</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Coin size={18} />
                    <span className="text-xl font-extrabold">{balances?.personalBalance ?? '—'}</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/[0.06] p-3.5">
                  <div className="text-xs text-white/65">Distribué</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Coin size={18} />
                    <span className="text-xl font-extrabold">{totalDistributed}</span>
                  </div>
                </div>
              </div>
            </DashboardHero>
          </>
        )}

        {/* Enveloppes tab: two views — received (still to distribute) and opened. */}
        {activeTab === 'enveloppes' && (
          loading ? loader
          : error ? errorNote
          : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-primo-mint p-1">
                <button
                  type="button"
                  onClick={() => setEnvView('recues')}
                  className={`rounded-full py-2 text-sm font-bold transition ${
                    envView === 'recues' ? 'bg-white text-primo-teal-strong shadow-sm' : 'text-primo-slate'
                  }`}
                >
                  Reçues ({envelopes.filter((e) => e.status === 'A_DISTRIBUER').length})
                </button>
                <button
                  type="button"
                  onClick={() => setEnvView('ouvertes')}
                  className={`rounded-full py-2 text-sm font-bold transition ${
                    envView === 'ouvertes' ? 'bg-white text-primo-teal-strong shadow-sm' : 'text-primo-slate'
                  }`}
                >
                  Ouvertes ({envelopes.filter((e) => e.status === 'DISTRIBUEE').length})
                </button>
              </div>

              {envView === 'recues' && (
                <section className={HISTORY}>
                  {envelopes.filter((e) => e.status === 'A_DISTRIBUER').length === 0 ? (
                    <p className={DASH_MSG}>Aucune enveloppe à distribuer.</p>
                  ) : (
                    <div className={ENV_GRID}>
                      {envelopes
                        .filter((e) => e.status === 'A_DISTRIBUER')
                        .map((e) => <EnvelopeTile key={e.allocationId} envelope={e} onOpen={setOpenEnvelope} />)}
                    </div>
                  )}
                  {openEnvelope && (
                    <RedistributionBlock
                      envelope={openEnvelope}
                      employees={employees ?? []}
                      motifGroups={motifGroups}
                      onCancel={() => setOpenEnvelope(null)}
                      onDistributed={onEnvelopeDistributed}
                    />
                  )}
                </section>
              )}

              {envView === 'ouvertes' && (
                <section className={HISTORY}>
                  {envelopes.filter((e) => e.status === 'DISTRIBUEE').length === 0 ? (
                    <p className={DASH_MSG}>Aucune enveloppe ouverte pour l'instant.</p>
                  ) : (
                    <div className={ENV_GRID}>
                      {envelopes
                        .filter((e) => e.status === 'DISTRIBUEE')
                        .map((e) => <EnvelopeTile key={e.allocationId} envelope={e} onOpen={setOpenEnvelope} />)}
                    </div>
                  )}
                </section>
              )}
            </>
          )
        )}

        {/* Offres tab: the manager spends their personal retribution balance (shared catalog). */}
        {activeTab === 'offres' && (
          <OfferCatalog
            isLoggedIn
            canRedeem
            heading="Offres partenaires"
            onRedeemed={load}
            onSeeSpending={() => setActiveTab('codes')}
            largeDesktopCards
          />
        )}

        {/* Mes codes tab: purchased promo codes, copyable. */}
        {activeTab === 'codes' && <MyPromoCodes />}

        {/* Employés tab: team management + attribution history. */}
        {activeTab === 'employes' && (
          loading ? loader
          : error ? errorNote
          : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
                <h2 className={HISTORY_TITLE}>Mes employés</h2>
                <button className={DASH_INVITE} type="button" onClick={handleGenerateInvite}>
                  <Icon name="plus" size={16} /> Générer un code employé
                </button>
              </div>
              {inviteCode && (
                <div className={DASH_MSG}>
                  Code d'invitation : <strong>{inviteCode}</strong>{' '}
                  <button type="button" className={DASH_RETRY} onClick={() => navigator.clipboard.writeText(inviteCode)}>Copier</button>
                </div>
              )}
              {inviteError && <p className={`${DASH_MSG} ${DASH_ERROR}`}>{inviteError}</p>}

              {employees && employees.length === 0 && <p className={DASH_MSG}>Aucun employé pour l'instant.</p>}
              {employees && employees.length > 0 && (
                <ul className={EMP_LIST}>
                  {employees.map((e) => (
                    <li className={EMP_ITEM} key={e.id}>
                      <div className={EMP_ROW}>
                        <Avatar initials={initials(e)} />
                        <div className={EMP_MAIN}>
                          <div className={EMP_NAME}>
                            {e.firstName} {e.lastName}
                            {e.isEmailVerified ? (
                              <span className={`${EMP_BADGE} ${EMP_BADGE_VERIFIED}`}><Icon name="check" size={13} strokeWidth={2.4} /> vérifié</span>
                            ) : (
                              <button type="button" className={EMP_ATTRIB_BTN} onClick={() => approveEmployee(e.id)}>Approuver</button>
                            )}
                          </div>
                          <div className={EMP_SUB}>{e.email} · inscrit le {formatDate(e.createdAt)}</div>
                        </div>
                        <div className={EMP_BALANCE}>
                          <div className={EMP_BALANCE_NUM}>{e.balance}</div>
                          <div className={EMP_BALANCE_LABEL}>tokens</div>
                        </div>
                        <button
                          type="button"
                          className={EMP_DELETE_BTN}
                          title="Supprimer cet employé"
                          disabled={deletingId === e.id}
                          onClick={() => handleDelete(e)}
                        >
                          {deletingId === e.id ? '…' : <Icon name="trash" size={18} />}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <DashHistory attributions={attributions} />
            </>
          )
        )}

        {/* Profil tab. */}
        {activeTab === 'profil' && (
          <>
            <EditProfile onPhotoChange={setHeroPhoto} />
            <PrivacySection onAccountDeleted={onLogout} />
            <button
              type="button"
              className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-primo-error-line bg-white px-4 py-3.5 text-[15px] font-bold text-primo-error hover:bg-primo-error-soft lg:hidden"
              onClick={handleLogout}
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
