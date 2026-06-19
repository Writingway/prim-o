import { useCallback, useEffect, useState } from 'react';
import { listAdminUsers, updateAdminUser, deleteAdminUser } from '../services/api';
import type { AdminUser, AdminRole, AdminStatus } from '../types/types';
import { useConfirm } from '../components/ui/ConfirmDialog';

const ROLES: (AdminRole | '')[] = ['', 'ADMIN', 'MANAGER', 'EMPLOYEE'];
const STATUSES: (AdminStatus | '')[] = ['', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZE = 20;

type Filters = { role: AdminRole | ''; status: AdminStatus | ''; search: string };

// onFlash : message transitoire remonté au parent (AdminPage gère l'affichage).
type AdminUsersProps = { onFlash: (msg: string) => void };

export default function AdminUsers({ onFlash }: AdminUsersProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ role: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listAdminUsers({
        page,
        limit: PAGE_SIZE,
        role: filters.role || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      if (res.ok && res.data) {
        setUsers(res.data.items);
        setTotal(res.data.total);
        setHasMore(res.data.hasMore);
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger les utilisateurs.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Tout changement de filtre repart à la page 1.
  const setFilter = (patch: Partial<Filters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const patchUser = async (
    u: AdminUser,
    payload: { role?: 'MANAGER' | 'EMPLOYEE'; status?: 'APPROVED' | 'REJECTED' },
    okMsg: string,
  ) => {
    const action = payload.role
      ? `changer le rôle de ${u.email} en ${payload.role}`
      : payload.status === 'APPROVED'
        ? `approuver ${u.email}`
        : `rejeter ${u.email}`;
    const ok = await confirm({
      title: 'Confirmer l’action',
      message: `Voulez-vous ${action} ?`,
      confirmLabel: 'Confirmer',
      danger: payload.status === 'REJECTED',
    });
    if (!ok) return;
    setBusyId(u.id);
    setError('');
    try {
      const res = await updateAdminUser(u.id, payload);
      if (res.ok) {
        onFlash(okMsg);
        load();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        // Le backend renvoie des messages métier clairs (dernier admin, auto-modif…).
        setError((res.data as { error?: string } | null)?.error ?? 'Action impossible.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u: AdminUser) => {
    const ok = await confirm({
      title: 'Supprimer cet utilisateur ?',
      message: `Supprimer ${u.email} ? (soft-delete réversible)`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setBusyId(u.id);
    setError('');
    try {
      const res = await deleteAdminUser(u.id);
      if (res.ok) {
        onFlash('Utilisateur supprimé.');
        load();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError((res.data as { error?: string } | null)?.error ?? 'Suppression impossible.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-filters">
        <input
          className="admin-filter-search"
          type="search"
          placeholder="Rechercher par email…"
          value={filters.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <select value={filters.role} onChange={(e) => setFilter({ role: e.target.value as AdminRole | '' })}>
          {ROLES.map((r) => (
            <option key={r || 'all'} value={r}>{r || 'Tous les rôles'}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilter({ status: e.target.value as AdminStatus | '' })}>
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>{s || 'Tous les statuts'}</option>
          ))}
        </select>
      </div>

      {loading && <p className="admin-msg">Chargement…</p>}
      {error && <p className="admin-msg admin-error">{error}</p>}

      {!loading && users && (
        users.length === 0 ? (
          <p className="admin-msg">Aucun utilisateur.</p>
        ) : (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nom</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Solde</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isAdmin = u.role === 'ADMIN';
                    const busy = busyId === u.id;
                    return (
                      <tr key={u.id}>
                        <td data-label="Email">{u.email}</td>
                        <td data-label="Nom">{u.firstName} {u.lastName}</td>
                        <td data-label="Rôle">
                          {isAdmin ? (
                            <span className="admin-badge inactive">ADMIN</span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={busy}
                              onChange={(e) =>
                                patchUser(u, { role: e.target.value as 'MANAGER' | 'EMPLOYEE' }, 'Rôle mis à jour.')
                              }
                            >
                              <option value="MANAGER">MANAGER</option>
                              <option value="EMPLOYEE">EMPLOYEE</option>
                            </select>
                          )}
                        </td>
                        <td data-label="Statut">
                          <span className={`admin-badge ${u.status === 'APPROVED' ? 'active' : 'inactive'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td data-label="Solde">{u.balance}</td>
                        <td className="admin-actions" data-label="Actions">
                          {u.status !== 'APPROVED' && (
                            <button className="admin-btn-link" disabled={busy}
                              onClick={() => patchUser(u, { status: 'APPROVED' }, 'Utilisateur approuvé.')}>
                              Approuver
                            </button>
                          )}
                          {u.status !== 'REJECTED' && (
                            <button className="admin-btn-link" disabled={busy}
                              onClick={() => patchUser(u, { status: 'REJECTED' }, 'Utilisateur rejeté.')}>
                              Rejeter
                            </button>
                          )}
                          <button className="admin-btn-link admin-btn-danger" disabled={busy}
                            onClick={() => remove(u)}>
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button className="admin-btn-ghost" disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                 Précédent
              </button>
              <span className="admin-page-info">
                Page {page} · {total} utilisateur{total > 1 ? 's' : ''}
              </span>
              <button className="admin-btn-ghost" disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}>
                Suivant →
              </button>
            </div>
          </>
        )
      )}
      {confirmDialog}
    </div>
  );
}
