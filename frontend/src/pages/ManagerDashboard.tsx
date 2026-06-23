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
import DashHistory from '../components/dashboard/DashHistory';
import Icon from '../components/ui/Icon';
import Coin from '../components/ui/Coin';
import { HEADER_BTN_GHOST } from '../components/layout/headerButtons';
import Avatar from '../components/dashboard/Avatar';
import DashTabs from '../components/dashboard/DashTabs';
import {
  DASH_WRAPPER, DASH_CONTAINER, DASH_STAT, DASH_STAT_STRONG, DASH_INVITE,
  DASH_MSG, DASH_ERROR, DASH_RETRY, HISTORY, HISTORY_TITLE, ENV_GRID,
  EMP_LIST, EMP_ITEM, EMP_ROW, EMP_MAIN, EMP_NAME, EMP_BADGE, EMP_BADGE_VERIFIED,
  EMP_ATTRIB_BTN, EMP_SUB, EMP_BALANCE, EMP_BALANCE_NUM, EMP_BALANCE_LABEL, EMP_DELETE_BTN,
} from '../components/dashboard/dashStyles';

type Props = { onLogout: () => void; onBack: () => void };

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

// Dashboard manager : ouvre ses enveloppes reçues et redistribue à ses employés.
// (Le manager ne distribue plus en direct : tout passe par les enveloppes.)
export default function ManagerDashboard({ onLogout, onBack }: Props) {
  const { confirm, confirmDialog } = useConfirm();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [attributions, setAttributions] = useState<AttributionHistory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  const [activeTab, setActiveTab] = useState<'enveloppes' | 'employes'>('enveloppes');
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // déconnexion front même si l'appel échoue
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

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'enveloppes', label: 'Mes enveloppes' },
    { key: 'employes', label: 'Mes employés' },
  ];

  return (
    <Layout
      title="Prim'O — Espace manager"
      chrome="app"
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.manager}
          active={activeTab}
          onSelect={(it) =>
            it.key === 'profil'
              ? document.getElementById('nav-profil')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              : setActiveTab(it.key as typeof activeTab)
          }
        />
      }
      headerActions={
        <>
          <button className={HEADER_BTN_GHOST} type="button" onClick={onBack}>Accueil</button>
          <button className={HEADER_BTN_GHOST} type="button" onClick={handleLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className={DASH_WRAPPER}>
      <div className={DASH_CONTAINER}>

        {/* Hero : enveloppe à distribuer + soldes (cf. README D1) */}
        <div className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-b from-primo-hero-from to-primo-ink-900 px-5 pb-6 pt-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-white/65">Espace manager</div>
              <div className="text-lg font-extrabold tracking-[-0.02em]">{company?.name ?? 'Mon équipe'}</div>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
              <Icon name="users" size={21} />
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.09] p-4">
            <div className="mb-2 flex items-center gap-2 text-white/65">
              <Icon name="envelope" size={18} />
              <span className="text-[13px] font-semibold">Enveloppe à distribuer</span>
            </div>
            <div className="flex items-end gap-2.5">
              <Coin size={36} />
              <span className="text-[42px] font-extrabold leading-none tracking-[-0.03em]">
                {balances?.envelopeRemaining ?? '—'}
              </span>
              <span className="mb-1.5 text-sm text-white/65">jetons</span>
            </div>
          </div>

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
              <div className="mt-1.5 text-xl font-extrabold">{totalDistributed}</div>
            </div>
          </div>
        </div>

        {/* Récap compact + invitation */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span className={DASH_STAT}>
            <strong className={DASH_STAT_STRONG}>{employees?.length ?? 0}</strong>&nbsp;employés
          </span>
          <span className={DASH_STAT}>
            <strong className={DASH_STAT_STRONG}>{company?.tokenBalance ?? '—'}</strong>&nbsp;pool entreprise
          </span>
          <button className={`${DASH_INVITE} ml-auto max-[520px]:ml-0`} type="button" onClick={handleGenerateInvite}>
            <Icon name="plus" size={16} /> Code employé
          </button>
        </div>

        {inviteCode && (
          <div className={DASH_MSG}>
            Code d'invitation : <strong>{inviteCode}</strong>{' '}
            <button type="button" className={DASH_RETRY} onClick={() => navigator.clipboard.writeText(inviteCode)}>Copier</button>
          </div>
        )}
        {inviteError && <p className={`${DASH_MSG} ${DASH_ERROR}`}>{inviteError}</p>}

        <DashTabs tabs={tabs} active={activeTab} onSelect={setActiveTab} />

        {loading && <p className={DASH_MSG}>Chargement…</p>}
        {!loading && error && (
          <div className={`${DASH_MSG} ${DASH_ERROR}`}>
            {error}{' '}
            <button type="button" className={DASH_RETRY} onClick={load}>Réessayer</button>
          </div>
        )}

        {/* Mes enveloppes reçues */}
        {!loading && !error && activeTab === 'enveloppes' && (
          <section className={HISTORY}>
            <h2 className={HISTORY_TITLE}>Mes enveloppes reçues</h2>
            {envelopes.length === 0 ? (
              <p className={DASH_MSG}>Aucune enveloppe pour l'instant.</p>
            ) : (
              <div className={ENV_GRID}>
                {envelopes.map((e) => <EnvelopeTile key={e.allocationId} envelope={e} onOpen={setOpenEnvelope} />)}
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

        {/* Mes employés (lecture + gestion d'équipe) + historique */}
        {!loading && !error && activeTab === 'employes' && (
          <>
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
        )}

        <div id="nav-profil" className="scroll-mt-20" />
        {!loading && <EditProfile />}
        {!loading && <PrivacySection onAccountDeleted={onLogout} />}
        <button
          type="button"
          className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-primo-error-line bg-white px-4 py-3.5 text-[15px] font-bold text-primo-error hover:bg-primo-error-soft lg:hidden"
          onClick={handleLogout}
        >
          <Icon name="logout" size={19} /> Se déconnecter
        </button>
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
