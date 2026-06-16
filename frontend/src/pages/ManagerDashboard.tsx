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
  logout as apiLogout,
} from '../services/api';
import type { Employee, Company, AttributionHistory } from '../types/types';
import './ManagerDashboard.css';
import Layout from '../components/layout/Layout';
import { useConfirm } from '../components/ui/ConfirmDialog';

type ManagerDashboardProps = {
  onLogout: () => void;
  onBack: () => void;
};

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Dashboard employeur : liste des employés de son entreprise (lecture seule).
export default function ManagerDashboard({ onLogout, onBack }: ManagerDashboardProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [attributions, setAttributions] = useState<AttributionHistory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  // Recharge du pool via Stripe.
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<'success' | 'cancel' | null>(null);

  // Formulaire d'attribution inline : un seul ouvert à la fois.
  const [attribOpenId, setAttribOpenId] = useState<string | null>(null);
  const [attribAmount, setAttribAmount] = useState('');
  const [attribReason, setAttribReason] = useState('');
  const [attribError, setAttribError] = useState('');
  const [attribSubmitting, setAttribSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, compRes, attrRes] = await Promise.all([
        listEmployees(),
        getCompany(),
        listAttributions(),
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
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

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
        await load(); // recharge liste + solde + historique
      } else {
        setError("Impossible de supprimer cet employé.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // On déconnecte côté front même si l'appel échoue.
    }
    onLogout();
  };

  const handleGenerateInvite = async () => {
    setInviteError('');
    try {
      const res = await generateInviteCode();
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
        setTimeout(() => { load(); }, 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAttrib = (id: string) => {
    setAttribOpenId(id);
    setAttribAmount('');
    setAttribReason('');
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
    if (!attribReason.trim()) {
      setAttribError('La raison est obligatoire.');
      return;
    }

    setAttribSubmitting(true);
    try {
      const res = await createAttribution({ employeeId, amount, reason: attribReason.trim() });
      if (res.ok) {
        closeAttrib();
        await load(); // recharge la liste → le solde de l'employé est à jour
      } else if (res.status === 409) {
        setAttribError('Solde insuffisant dans le pool entreprise.');
      } else if (res.status === 400) {
        setAttribError('Montant et raison obligatoires.');
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

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  //Approved button for manager when employee is pending
  const approveEmployee = async (employeeId: string) => {
    try {
      // Passe par api.ts : profite du wrapper 401 → refresh → retry.
      const res = await apiApproveEmployee(employeeId);
      if (res.ok) {
        await load();
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
      title="Prim'O — Mes employés"
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>
            ← Accueil
          </button>
          <button className="app-btn app-btn-ghost" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </>
      }
    >
    <div className="dash-wrapper">
      <div className="dash-container">

        <div className="dash-stats">
          <div className="dash-stat dash-stat-pool">🏦 <strong>{company?.tokenBalance ?? '—'}</strong>&nbsp;tokens disponibles</div>
          <div className="dash-stat">👥 <strong>{employees?.length ?? 0}</strong>&nbsp;employés</div>
          <div className="dash-stat">🪙 <strong>{totalDistributed}</strong>&nbsp;tokens distribués</div>
          <button className="dash-invite" type="button" onClick={handleGenerateInvite}>
            Générer un code d'invitation
          </button>
        </div>

        {paymentNotice === 'success' && (
          <div className="dash-msg">✅ Paiement réussi ! Ton pool va être crédité dans un instant.</div>
        )}
        {paymentNotice === 'cancel' && (
          <div className="dash-msg dash-error">Paiement annulé.</div>
        )}

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
            <button type="button" className="dash-retry" onClick={load}>Réessayer</button>
          </div>
        )}

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
                    onClick={() => (attribOpenId === e.id ? closeAttrib() : openAttrib(e.id))}
                  >
                    {attribOpenId === e.id ? 'Annuler' : 'Attribuer'}
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
                  <form
                    className="emp-attrib-form"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      submitAttrib(e.id);
                    }}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Montant"
                      value={attribAmount}
                      onChange={(ev) => setAttribAmount(ev.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Raison (obligatoire)"
                      value={attribReason}
                      onChange={(ev) => setAttribReason(ev.target.value)}
                    />
                    <button type="submit" className="emp-attrib-submit" disabled={attribSubmitting}>
                      {attribSubmitting ? '…' : 'Valider'}
                    </button>
                    {attribError && <p className="emp-attrib-error">{attribError}</p>}
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
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
