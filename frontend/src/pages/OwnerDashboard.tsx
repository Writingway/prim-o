import { useEffect, useState } from 'react';
import {
  listEmployees,
  getCompany,
  listAttributions,
  deleteEmployee,
  generateInviteCode,
  createAttribution,
  approveEmployee as apiApproveEmployee,
  createCheckout,
  listManagers,
  allocateTokens,
  listMotifs,
  listSentEnvelopes,
  logout as apiLogout,
} from '../services/api';
import type { CompanyManager } from '../services/api';
import type { Employee, Company, AttributionHistory } from '../types/types';
import type { RetributionMode, MotifCategoryGroup, SentEnvelope } from '../types/types';
import { formatDate } from '../lib/format';
import './ManagerDashboard.css';
import Layout from '../components/layout/Layout';
import PrivacySection from '../components/privacy/PrivacySection';
import EditProfile from '../components/privacy/EditProfile';
import { useConfirm } from '../components/ui/ConfirmDialog';
import ModeSelector from '../components/allocation/ModeSelector';
import MotifSelect from '../components/allocation/MotifSelect';
import SentEnvelopeTile from '../components/allocation/SentEnvelopeTile';
import DashHistory from '../components/dashboard/DashHistory';

type Props = { onLogout: () => void; onBack: () => void; onStats?: () => void };

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

// Dashboard patron : alloue des enveloppes aux managers (avec mode), suit les
// enveloppes envoyées, et distribue en direct à ses employés (montant + motif).
export default function OwnerDashboard({ onLogout, onBack, onStats }: Props) {
  const { confirm, confirmDialog } = useConfirm();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [attributions, setAttributions] = useState<AttributionHistory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  const [activeTab, setActiveTab] = useState<'managers' | 'envoyees' | 'employes'>('managers');
  const [motifGroups, setMotifGroups] = useState<MotifCategoryGroup[]>([]);

  // Recharge du pool via Stripe.
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<'success' | 'cancel' | null>(null);

  // Managers + enveloppes envoyées.
  const [managers, setManagers] = useState<CompanyManager[]>([]);
  const [sentEnvelopes, setSentEnvelopes] = useState<SentEnvelope[]>([]);
  const [allocOpenId, setAllocOpenId] = useState<string | null>(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [allocMode, setAllocMode] = useState<RetributionMode>('PART_EGALE');
  const [allocPercentage, setAllocPercentage] = useState('');
  const [allocError, setAllocError] = useState('');
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  // Envoi direct → employé (montant + motif).
  const [attribOpenId, setAttribOpenId] = useState<string | null>(null);
  const [attribAmount, setAttribAmount] = useState('');
  const [attribMotif, setAttribMotif] = useState('');
  const [attribError, setAttribError] = useState('');
  const [attribSubmitting, setAttribSubmitting] = useState(false);

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

      const [mgrRes, sentRes] = await Promise.all([listManagers(), listSentEnvelopes()]);
      if (mgrRes.ok && mgrRes.data) setManagers(mgrRes.data.managers);
      if (sentRes.ok && sentRes.data) setSentEnvelopes(sentRes.data.envelopes);
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

  // Retour de Stripe : ?payment=success|cancel.
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment === 'success' || payment === 'cancel') {
      setPaymentNotice(payment);
      window.history.replaceState({}, '', window.location.pathname);
      if (payment === 'success') setTimeout(() => { load(); }, 1500);
    }
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

  const handleGenerateInvite = async (inviteRole: 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE') => {
    setInviteError('');
    try {
      const res = await generateInviteCode(inviteRole);
      if (res.ok && res.data?.invite) setInviteCode(res.data.invite.code);
      else if (res.status === 401) setInviteError('Session expirée, reconnecte-toi.');
      else setInviteError("Impossible de générer le code d'invitation.");
    } catch {
      setInviteError('Impossible de joindre le serveur.');
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    const amount = Number(rechargeAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setRechargeError('Le montant doit être un entier positif.');
      return;
    }
    setRecharging(true);
    try {
      const res = await createCheckout(amount);
      if (res.ok && res.data?.url) window.location.href = res.data.url;
      else if (res.status === 401) setRechargeError('Session expirée, reconnecte-toi.');
      else setRechargeError('Impossible de démarrer le paiement.');
    } catch {
      setRechargeError('Impossible de joindre le serveur.');
    } finally {
      setRecharging(false);
    }
  };

  const openAlloc = (id: string) => {
    setAllocOpenId(id);
    setAllocAmount('');
    setAllocMode('PART_EGALE');
    setAllocPercentage('');
    setAllocError('');
  };

  const submitAlloc = async (managerId: string) => {
    setAllocError('');
    const amount = Number(allocAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setAllocError('Le montant doit être un entier positif.');
      return;
    }
    let percentage: number | undefined;
    if (allocMode === 'POURCENTAGE') {
      percentage = Number(allocPercentage);
      if (!Number.isInteger(percentage) || percentage < 1 || percentage > 100) {
        setAllocError('Le pourcentage doit être un entier entre 1 et 100.');
        return;
      }
    }
    setAllocSubmitting(true);
    try {
      const res = await allocateTokens(managerId, amount, allocMode, percentage);
      if (res.ok) {
        setAllocOpenId(null);
        await load();
      } else if (res.status === 401) {
        setAllocError('Session expirée, reconnecte-toi.');
      } else {
        const msg = res.data && 'error' in res.data ? res.data.error : "Échec de l'allocation.";
        setAllocError(msg);
      }
    } catch {
      setAllocError('Impossible de joindre le serveur.');
    } finally {
      setAllocSubmitting(false);
    }
  };

  const openAttrib = (id: string) => {
    setAttribOpenId(id);
    setAttribAmount('');
    setAttribMotif('');
    setAttribError('');
  };

  const closeAttrib = () => {
    setAttribOpenId(null);
    setAttribError('');
  };

  const submitAttrib = async (employeeId: string) => {
    setAttribError('');
    const amount = Number(attribAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setAttribError('Le montant doit être un entier positif.');
      return;
    }
    if (!attribMotif) {
      setAttribError('Le motif est obligatoire.');
      return;
    }
    setAttribSubmitting(true);
    try {
      const res = await createAttribution({ employeeId, amount, motifId: attribMotif });
      if (res.ok) {
        closeAttrib();
        await load();
      } else if (res.status === 409) {
        const msg = res.data && 'error' in res.data ? res.data.error : 'Solde de tokens insuffisant.';
        setAttribError(msg);
      } else if (res.status === 401) {
        setAttribError('Session expirée, reconnecte-toi.');
      } else {
        const msg = res.data && 'error' in res.data ? res.data.error : "Échec de l'attribution.";
        setAttribError(msg);
      }
    } catch {
      setAttribError('Impossible de joindre le serveur.');
    } finally {
      setAttribSubmitting(false);
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

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'managers', label: 'Mes managers' },
    { key: 'envoyees', label: 'Mes enveloppes envoyées' },
    { key: 'employes', label: 'Mes employés' },
  ];

  return (
    <Layout
      title="Prim'O — Espace patron"
      headerActions={
        <>
          {onStats && (
            <button className="app-btn app-btn-ghost" type="button" onClick={onStats}>📊 Statistiques</button>
          )}
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>← Accueil</button>
          <button className="app-btn app-btn-ghost" type="button" onClick={handleLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className="dash-wrapper">
      <div className="dash-container">

        <div className="dash-stats">
          <div className="dash-stat dash-stat-pool">🏦 <strong>{company?.tokenBalance ?? '—'}</strong>&nbsp;pool entreprise</div>
          <div className="dash-stat">👥 <strong>{employees?.length ?? 0}</strong>&nbsp;employés</div>
          <div className="dash-stat">🪙 <strong>{totalDistributed}</strong>&nbsp;tokens distribués</div>
          <button className="dash-invite" type="button" onClick={() => handleGenerateInvite('MANAGER')}>Code manager</button>
          <button className="dash-invite" type="button" onClick={() => handleGenerateInvite('EMPLOYEE')}>Code employé</button>
        </div>

        {paymentNotice === 'success' && (
          <div className="dash-msg">✅ Paiement réussi ! Ton pool va être crédité dans un instant.</div>
        )}
        {paymentNotice === 'cancel' && <div className="dash-msg dash-error">Paiement annulé.</div>}

        <form className="dash-recharge" onSubmit={handleRecharge}>
          <input
            type="number" min="1" step="1" placeholder="Nb de tokens"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
          />
          <button className="dash-invite" type="submit" disabled={recharging}>
            {recharging ? '…' : '💳 Recharger le pool'}
          </button>
          {rechargeError && <p className="dash-msg dash-error">{rechargeError}</p>}
        </form>

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

        {/* Mes managers : allocation + mode */}
        {!loading && !error && activeTab === 'managers' && (
          <section className="history">
            <h2 className="history-title">Allouer des tokens à un manager</h2>
            {managers.length === 0 ? (
              <p className="dash-msg">Aucun manager pour l'instant.</p>
            ) : (
              <ul className="emp-list">
                {managers.map((m) => (
                  <li className="emp-item" key={m.id}>
                    <div className="emp-row">
                      <div className="emp-avatar">
                        {`${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase()}
                      </div>
                      <div className="emp-main">
                        <div className="emp-name">{m.firstName} {m.lastName}</div>
                        <div className="emp-sub">{m.email}</div>
                      </div>
                      <button
                        type="button"
                        className="emp-attrib-btn"
                        onClick={() => (allocOpenId === m.id ? setAllocOpenId(null) : openAlloc(m.id))}
                      >
                        {allocOpenId === m.id ? 'Annuler' : 'Attribuer'}
                      </button>
                    </div>
                    {allocOpenId === m.id && (
                      <form className="emp-attrib-form" onSubmit={(ev) => { ev.preventDefault(); submitAlloc(m.id); }}>
                        <input
                          className="alloc-input" type="number" min="1" step="1"
                          placeholder="Montant de l'enveloppe"
                          value={allocAmount}
                          onChange={(ev) => setAllocAmount(ev.target.value)}
                        />
                        <ModeSelector
                          mode={allocMode}
                          percentage={allocPercentage}
                          onModeChange={setAllocMode}
                          onPercentageChange={setAllocPercentage}
                        />
                        <button type="submit" className="emp-attrib-submit" disabled={allocSubmitting}>
                          {allocSubmitting ? '…' : "Envoyer l'enveloppe"}
                        </button>
                        {allocError && <p className="emp-attrib-error">{allocError}</p>}
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Mes enveloppes envoyées */}
        {!loading && !error && activeTab === 'envoyees' && (
          <section className="history">
            <h2 className="history-title">Mes enveloppes envoyées</h2>
            {sentEnvelopes.length === 0 ? (
              <p className="dash-msg">Aucune enveloppe envoyée pour l'instant.</p>
            ) : (
              <div className="env-grid">
                {sentEnvelopes.map((e) => <SentEnvelopeTile key={e.allocationId} envelope={e} />)}
              </div>
            )}
          </section>
        )}

        {/* Mes employés : envoi direct (montant + motif) + historique */}
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
                        className="emp-attrib-btn"
                        onClick={() => (attribOpenId === e.id ? closeAttrib() : openAttrib(e.id))}
                      >
                        {attribOpenId === e.id ? 'Annuler' : 'Envoyer'}
                      </button>
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

                    {attribOpenId === e.id && (
                      <form className="emp-attrib-form" onSubmit={(ev) => { ev.preventDefault(); submitAttrib(e.id); }}>
                        <input
                          className="alloc-input" type="number" min="1" step="1" placeholder="Montant"
                          value={attribAmount}
                          onChange={(ev) => setAttribAmount(ev.target.value)}
                        />
                        <MotifSelect groups={motifGroups} value={attribMotif} onChange={setAttribMotif} />
                        <button type="submit" className="emp-attrib-submit" disabled={attribSubmitting}>
                          {attribSubmitting ? '…' : 'Envoyer'}
                        </button>
                        {attribError && <p className="emp-attrib-error">{attribError}</p>}
                      </form>
                    )}
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
