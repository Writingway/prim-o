import { useEffect, useState } from 'react';
import { listEmployees, generateInviteCode, logout as apiLogout } from '../services/api';
import type { Employee } from '../types/types';
import './ManagerDashboard.css';

type ManagerDashboardProps = {
  accessToken: string;
  onLogout: () => void;
};

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Dashboard employeur : liste des employés de son entreprise (lecture seule).
export default function ManagerDashboard({ accessToken, onLogout }: ManagerDashboardProps) {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listEmployees(accessToken);
      if (res.ok && res.data) {
        setEmployees(res.data.employees);
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger les employés.');
      }
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
      const res = await generateInviteCode(accessToken);
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

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  return (
    <div className="dash-wrapper">
      <div className="dash-container">
        <header className="dash-header">
          <h1 className="dash-title">Prim'O — Mes employés</h1>
          <button className="dash-logout" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </header>

        <div className="dash-stats">
          <div className="dash-stat">👥 <strong>{employees?.length ?? 0}</strong>&nbsp;employés</div>
          <div className="dash-stat">🪙 <strong>{totalDistributed}</strong>&nbsp;tokens distribués</div>
          <button className="dash-invite" type="button" onClick={handleGenerateInvite}>
            Générer un code d'invitation
          </button>
        </div>

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
              <li className="emp-row" key={e.id}>
                <div className="emp-avatar">{initials(e)}</div>
                <div className="emp-main">
                  <div className="emp-name">
                    {e.firstName} {e.lastName}
                    {e.isEmailVerified ? (
                      <span className="emp-badge verified">✓ vérifié</span>
                    ) : (
                      <span className="emp-badge pending">en attente</span>
                    )}
                  </div>
                  <div className="emp-sub">{e.email} · inscrit le {formatDate(e.createdAt)}</div>
                </div>
                <div className="emp-balance">
                  <div className="emp-balance-num">{e.balance}</div>
                  <div className="emp-balance-label">tokens</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
