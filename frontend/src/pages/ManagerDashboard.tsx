import { useEffect, useState } from 'react';
import {
  deleteEmployee,
  generateInviteCode,
  approveEmployee as apiApproveEmployee,
  createCheckout,
  logout as apiLogout,
} from '@/services/api';
import type { Employee, Role } from '@/types/types';
import './ManagerDashboard.css';
import Layout from '@/components/layout/Layout';
import ManagerBalances from '@/components/manager/ManagerBalances';
import DistributeForm from '@/components/manager/DistributeForm';
import BottomNav from '@/components/layout/BottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useManagerData } from '@/hooks/useManagerData';
import { useAllocation } from '@/hooks/useAllocation';
import { useAttribution } from '@/hooks/useAttribution';
import { formatDate } from '@/lib/format';

type ManagerDashboardProps = {
  role: Role;
  onLogout: () => void;
  onBack: () => void;
};

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

// Dashboard employeur : liste des employés de son entreprise (lecture seule).
export default function ManagerDashboard({ role, onLogout, onBack }: ManagerDashboardProps) {
  const { confirm, confirmDialog } = useConfirm();
  const {
    employees, company, attributions, myBalance, managers,
    error, setError, loading, reload,
  } = useManagerData(role);
  const alloc = useAllocation(reload);
  const attrib = useAttribution(reload);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  // Recharge du pool via Stripe.
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<'success' | 'cancel' | null>(null);

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
      if (res.ok) {
        await reload(); // recharge liste + solde + historique
      } else {
        setError("Impossible de supprimer cet employé.");
      }
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
      // On déconnecte côté front même si l'appel échoue.
    }
    onLogout();
  };

  const handleGenerateInvite = async (inviteRole: 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE') => {
    setInviteError('');
    try {
      const res = await generateInviteCode(inviteRole);
      if (res.ok && res.data?.invite) {
        setInviteCode(res.data.invite.code);
      } else if (res.status === 401) {
        setInviteError('Session expirée, reconnecte-toi.');
      } else {
        setInviteError('Impossible de générer le code d\'invitation.');
      }
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
      if (res.ok && res.data?.url) {
        window.location.href = res.data.url; // on quitte le SPA pour la page Stripe
      } else if (res.status === 401) {
        setRechargeError('Session expirée, reconnecte-toi.');
      } else {
        setRechargeError('Impossible de démarrer le paiement.');
      }
    } catch {
      setRechargeError('Impossible de joindre le serveur.');
    } finally {
      setRecharging(false);
    }
  };

  // Retour de Stripe : lit ?payment=success|cancel, affiche un message,
  // nettoie l'URL, et recharge le solde (le webhook crédite en ~1-2 s).
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment === 'success' || payment === 'cancel') {
      setPaymentNotice(payment);
      window.history.replaceState({}, '', window.location.pathname);
      if (payment === 'success') {
        setTimeout(() => { reload(); }, 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  // Approve button pour manager quand l'employé est en attente.
  const approveEmployee = async (employeeId: string) => {
    try {
      // Passe par api.ts : profite du wrapper 401 → refresh → retry.
      const res = await apiApproveEmployee(employeeId);
      if (res.ok) {
        await reload();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError("Impossible d'approuver cet employé.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  return (
    <Layout
      title="Prim'O - Mes employés"
      chrome={role === 'manager' ? 'app' : 'public'}
      bottomNav={
        role === 'manager' ? (
          <BottomNav
            items={[
              { key: 'solde', label: 'Solde', icon: '🪙', targetId: 'nav-solde' },
              { key: 'distribuer', label: 'Distribuer', icon: '🎁', targetId: 'nav-distribuer' },
              { key: 'equipe', label: 'Équipe', icon: '👥', targetId: 'nav-equipe' },
              { key: 'profil', label: 'Profil', icon: '👤', targetId: 'nav-profil' },
            ]}
          />
        ) : undefined
      }
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>
             Accueil
          </button>
          <button className="app-btn app-btn-ghost" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </>
      }
    >
    <div className="dash-wrapper">
      <div className="dash-container">

        {/* §3.3 — double solde (enveloppe / perso) + historiques envoyés/reçus. */}
        {role === 'manager' && (
          <div className="mb-4 flex flex-col gap-4">
            <div id="nav-solde" className="scroll-mt-20">
              <ManagerBalances />
            </div>
            <div id="nav-distribuer" className="scroll-mt-20">
              <DistributeForm employees={employees ?? []} onDone={reload} />
            </div>
          </div>
        )}

        <div className="dash-stats">
          <div className="dash-stat dash-stat-pool">🏦 <strong>{company?.tokenBalance ?? '-'}</strong>&nbsp;pool entreprise</div>
          {role === 'manager' && (
            <div className="dash-stat">🪙 <strong>{myBalance ?? '-'}</strong>&nbsp;mes tokens</div>
          )}
          <div className="dash-stat">👥 <strong>{employees?.length ?? 0}</strong>&nbsp;employés</div>
          <div className="dash-stat">🪙 <strong>{totalDistributed}</strong>&nbsp;tokens distribués</div>
          {role === 'owner' && (
            <button className="dash-invite" type="button" onClick={() => handleGenerateInvite('MANAGER')}>
              Code manager
            </button>
          )}
          <button className="dash-invite" type="button" onClick={() => handleGenerateInvite('EMPLOYEE')}>
            Code employé
          </button>
        </div>

        {paymentNotice === 'success' && (
          <div className="dash-msg">✅ Paiement réussi ! Ton pool va être crédité dans un instant.</div>
        )}
        {paymentNotice === 'cancel' && (
          <div className="dash-msg dash-error">Paiement annulé.</div>
        )}

        {role === 'owner' && (
          <form className="dash-recharge" onSubmit={handleRecharge}>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Nb de tokens"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
            />
            <button className="dash-invite" type="submit" disabled={recharging}>
              {recharging ? '…' : '💳 Recharger le pool'}
            </button>
            {rechargeError && <p className="dash-msg dash-error">{rechargeError}</p>}
          </form>
        )}

        {role === 'owner' && managers.length > 0 && (
          <section className="history">
            <h2 className="history-title">Allouer des tokens aux managers</h2>
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
                    <div className="emp-balance">
                      <div className="emp-balance-num">{m.balance}</div>
                      <div className="emp-balance-label">tokens</div>
                    </div>
                    <button
                      type="button"
                      className="emp-attrib-btn"
                      onClick={() => alloc.toggle(m.id)}
                    >
                      {alloc.openId === m.id ? 'Annuler' : 'Allouer'}
                    </button>
                  </div>
                  {alloc.openId === m.id && (
                    <form
                      className="emp-attrib-form"
                      onSubmit={(ev) => { ev.preventDefault(); alloc.submit(m.id); }}
                    >
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Montant"
                        value={alloc.amount}
                        onChange={(ev) => alloc.setAmount(ev.target.value)}
                      />
                      <button type="submit" className="emp-attrib-submit" disabled={alloc.submitting}>
                        {alloc.submitting ? '…' : 'Allouer'}
                      </button>
                      {alloc.error && <p className="emp-attrib-error">{alloc.error}</p>}
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {inviteCode && (
          <div className="dash-msg">
            Code d'invitation : <strong>{inviteCode}</strong>{' '}
            <button
              type="button"
              className="dash-retry"
              onClick={() => navigator.clipboard.writeText(inviteCode)}
            >
              Copier
            </button>
          </div>
        )}
        {inviteError && <p className="dash-msg dash-error">{inviteError}</p>}

        {loading && <p className="dash-msg">Chargement…</p>}

        {!loading && error && (
          <div className="dash-msg dash-error">
            {error}{' '}
            <button type="button" className="dash-retry" onClick={reload}>Réessayer</button>
          </div>
        )}

        <div id="nav-equipe" className="scroll-mt-20" aria-hidden="true" />

        {!loading && !error && employees && employees.length === 0 && (
          <p className="dash-msg">Aucun employé pour l'instant.</p>
        )}

        {!loading && !error && employees && employees.length > 0 && (
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
                        <button
                          type="button"
                          className="emp-attrib-btn"
                          onClick={() => approveEmployee(e.id)}>
                          Approuver
                        </button>
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
                    onClick={() => attrib.toggle(e.id)}
                  >
                    {attrib.openId === e.id ? 'Annuler' : 'Attribuer'}
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

                {attrib.openId === e.id && (
                  <form
                    className="emp-attrib-form"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      attrib.submit(e.id);
                    }}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Montant"
                      value={attrib.amount}
                      onChange={(ev) => attrib.setAmount(ev.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Raison (obligatoire)"
                      value={attrib.reason}
                      onChange={(ev) => attrib.setReason(ev.target.value)}
                    />
                    <button type="submit" className="emp-attrib-submit" disabled={attrib.submitting}>
                      {attrib.submitting ? '…' : 'Valider'}
                    </button>
                    {attrib.error && <p className="emp-attrib-error">{attrib.error}</p>}
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && (
          <section className="history">
            <h2 className="history-title">Historique des transactions</h2>
            {attributions.length === 0 ? (
              <p className="dash-msg">Aucune transaction pour l'instant.</p>
            ) : (
              <ul className="history-list">
                {attributions.map((a) => (
                  <li className="history-row" key={a.id}>
                    <span className="history-emp">
                      {a.employee.firstName} {a.employee.lastName}
                    </span>
                    <span className="history-reason">{a.reason}</span>
                    <span className="history-date">{formatDate(a.createdAt)}</span>
                    <span className="history-amount">+{a.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {!loading && <EditProfile />}
        <div id="nav-profil" className="scroll-mt-20" />
        {!loading && <PrivacySection onAccountDeleted={onLogout} />}
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
