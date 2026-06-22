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
import PrivacySection from '../components/privacy/PrivacySection';
import EditProfile from '../components/privacy/EditProfile';
import { useConfirm } from '../components/ui/ConfirmDialog';
import EnvelopeTile from '../components/allocation/EnvelopeTile';
import RedistributionBlock from '../components/allocation/RedistributionBlock';
import DashHistory from '../components/dashboard/DashHistory';

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
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>← Accueil</button>
          <button className="app-btn app-btn-ghost" type="button" onClick={handleLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className="dash-wrapper">
      <div className="dash-container">

        <div className="dash-stats">
          <div className="dash-stat dash-stat-pool">🏦 <strong>{company?.tokenBalance ?? '—'}</strong>&nbsp;pool entreprise</div>
          <div className="dash-stat">🪙 <strong>{balances?.personalBalance ?? '—'}</strong>&nbsp;mes tokens</div>
          <div className="dash-stat">✉️ <strong>{balances?.envelopeRemaining ?? '—'}</strong>&nbsp;à distribuer</div>
          <div className="dash-stat">👥 <strong>{employees?.length ?? 0}</strong>&nbsp;employés</div>
          <div className="dash-stat">🪙 <strong>{totalDistributed}</strong>&nbsp;tokens distribués</div>
          <button className="dash-invite" type="button" onClick={handleGenerateInvite}>Code employé</button>
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
                            <span className="emp-badge verified">✓ vérifié</span>
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
                        {deletingId === e.id ? '…' : '🗑️'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <DashHistory attributions={attributions} />
          </>
        )}

        {!loading && <EditProfile />}
        {!loading && <PrivacySection onAccountDeleted={onLogout} />}
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
