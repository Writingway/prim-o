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
import './ManagerDashboard.css';
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
    <div className="dash-wrapper">
      <div className="dash-container">

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
          <span className="rounded-[14px] border border-primo-line bg-white px-3.5 py-2.5 text-sm text-primo-slate">
            <strong className="text-primo-ink">{employees?.length ?? 0}</strong>&nbsp;employés
          </span>
          <span className="rounded-[14px] border border-primo-line bg-white px-3.5 py-2.5 text-sm text-primo-slate">
            <strong className="text-primo-ink">{company?.tokenBalance ?? '—'}</strong>&nbsp;pool entreprise
          </span>
          <button className="dash-invite inline-flex items-center gap-1.5" type="button" onClick={handleGenerateInvite}>
            <Icon name="plus" size={16} /> Code employé
          </button>
        </div>

        {inviteCode && (
          <div className="dash-msg">
            Code d'invitation : <strong>{inviteCode}</strong>{' '}
            <button type="button" className="dash-retry" onClick={() => navigator.clipboard.writeText(inviteCode)}>Copier</button>
          </div>
        )}
        {inviteError && <p className="dash-msg dash-error">{inviteError}</p>}

        <div className="dash-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`dash-tab${activeTab === t.key ? ' is-active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="dash-msg">Chargement…</p>}
        {!loading && error && (
          <div className="dash-msg dash-error">
            {error}{' '}
            <button type="button" className="dash-retry" onClick={load}>Réessayer</button>
          </div>
        )}

        {/* Mes enveloppes reçues */}
        {!loading && !error && activeTab === 'enveloppes' && (
          <section className="history">
            <h2 className="history-title">Mes enveloppes reçues</h2>
            {envelopes.length === 0 ? (
              <p className="dash-msg">Aucune enveloppe pour l'instant.</p>
            ) : (
              <div className="env-grid">
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
            {employees && employees.length === 0 && <p className="dash-msg">Aucun employé pour l'instant.</p>}
            {employees && employees.length > 0 && (
              <ul className="emp-list">
                {employees.map((e) => (
                  <li className="emp-item" key={e.id}>
                    <div className="emp-row">
                      <div className="emp-avatar">{initials(e)}</div>
                      <div className="emp-main">
                        <div className="emp-name">
                          {e.firstName} {e.lastName}
                          {e.isEmailVerified ? (
                            <span className="emp-badge verified"><Icon name="check" size={13} strokeWidth={2.4} /> vérifié</span>
                          ) : (
                            <button type="button" className="emp-attrib-btn" onClick={() => approveEmployee(e.id)}>Approuver</button>
                          )}
                        </div>
                        <div className="emp-sub">{e.email} · inscrit le {formatDate(e.createdAt)}</div>
                      </div>
                      <div className="emp-balance">
                        <div className="emp-balance-num">{e.balance}</div>
                        <div className="emp-balance-label">tokens</div>
                      </div>
                      <button
                        type="button"
                        className="emp-delete-btn"
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
          className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-[#f0c9c9] bg-white px-4 py-3.5 text-[15px] font-bold text-primo-error hover:bg-primo-error-soft lg:hidden"
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
