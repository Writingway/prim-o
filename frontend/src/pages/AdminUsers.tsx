import { useCallback, useEffect, useState } from 'react';
import { listAdminUsers, updateAdminUser, deleteAdminUser } from '../services/api';
import type { AdminUser, AdminRole } from '../types/types';
import { useConfirm } from '../components/ui/ConfirmDialog';
import Icon from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import {
  ADMIN_ACTIONS,
  ADMIN_BTN_DANGER,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LINK,
  ADMIN_MSG,
  ADMIN_PAGE_INFO,
  ADMIN_PAGINATION,
  ADMIN_SELECT,
  ADMIN_TABLE,
  ADMIN_TABLE_SCROLL,
  ADMIN_TD,
  ADMIN_TH,
} from './adminClasses';

const ROLES: (AdminRole | '')[] = ['', 'ADMIN', 'MANAGER', 'EMPLOYEE'];
const PAGE_SIZE = 20;

type Filters = { role: AdminRole | ''; search: string };

// onFlash: transient notice bubbled up to AdminPage, which owns its display.
type AdminUsersProps = { onFlash: (msg: string) => void };

const AVATAR_BG = [
  'bg-primo-teal-soft text-primo-teal-dark',
  'bg-primo-warn-soft text-primo-warn-strong',
  'bg-primo-success-soft text-primo-success',
  'bg-primo-mint text-primo-teal-dark',
];
function avatarFor(name: string) {
  const initials = name.trim().slice(0, 2).toUpperCase() || '??';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_BG.length;
  return { initials, cls: AVATAR_BG[hash] };
}

const INPUT_CLS =
  'rounded-xl border border-primo-line bg-primo-bg px-3 py-2 text-sm text-primo-ink outline-none transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]';

function emailVerifiedBadge(verified: boolean) {
  return verified
    ? 'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-success-soft text-primo-success'
    : 'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-warn-soft text-primo-warn-strong';
}

export default function AdminUsers({ onFlash }: AdminUsersProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ role: '', search: '' });
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const setFilter = (patch: Partial<Filters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const patchUser = async (
    u: AdminUser,
    payload: { role?: 'MANAGER' | 'EMPLOYEE'; isEmailVerified?: boolean },
    okMsg: string,
  ) => {
    const action = payload.role
      ? `changer le rôle de ${u.email} en ${payload.role}`
      : payload.isEmailVerified
        ? `vérifier l'email de ${u.email}`
        : `révoquer la vérification email de ${u.email}`;
    const ok = await confirm({
      title: "Confirmer l'action",
      message: `Voulez-vous ${action} ?`,
      confirmLabel: 'Confirmer',
      danger: payload.isEmailVerified === false,
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
        // The backend returns clear business-rule messages (last admin, self-modification…),
        // so surface them as-is.
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

  const startIdx = (page - 1) * PAGE_SIZE + 1;
  const endIdx = users ? Math.min(startIdx + users.length - 1, total) : 0;

  return (
    <div className="rounded-2xl border border-primo-line bg-white p-5 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="users" size={18} className="text-primo-teal" />
          <span className="text-[17px] font-extrabold tracking-[-0.01em] text-primo-ink">
            Utilisateurs
          </span>
          {!loading && (
            <span className="text-[13px] text-primo-gray">
              - {total} au total
            </span>
          )}
        </div>
        {!loading && users && users.length > 0 && (
          <span className="text-[13px] text-primo-gray">
            {startIdx} - {endIdx} sur {total}
          </span>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primo-gray"
          />
          <input
            className={`${INPUT_CLS} pl-8 w-full`}
            type="search"
            placeholder="Rechercher par email…"
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <select
          className={INPUT_CLS}
          value={filters.role}
          onChange={(e) => setFilter({ role: e.target.value as AdminRole | '' })}
        >
          {ROLES.map((r) => (
            <option key={r || 'all'} value={r}>{r || 'Tous les rôles'}</option>
          ))}
        </select>
      </div>

      {loading && <p className={ADMIN_MSG}>Chargement…</p>}
      {error && <p className="py-8 text-center text-sm text-primo-error">{error}</p>}

      {!loading && users && (
        users.length === 0 ? (
          <p className={ADMIN_MSG}>Aucun utilisateur.</p>
        ) : (
          <>
            <div className={ADMIN_TABLE_SCROLL}>
              <table className={ADMIN_TABLE}>
                <thead>
                  <tr>
                    <th className={ADMIN_TH}>Email</th>
                    <th className={ADMIN_TH}>Nom</th>
                    <th className={ADMIN_TH}>Rôle</th>
                    <th className={ADMIN_TH}>Email vérifié</th>
                    <th className={ADMIN_TH}>Solde</th>
                    <th className={ADMIN_TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isAdmin = u.role === 'ADMIN';
                    const busy = busyId === u.id;
                    const fullName = `${u.firstName} ${u.lastName}`.trim();
                    const av = avatarFor(fullName || u.email);
                    return (
                      <tr key={u.id}>
                        <td className={ADMIN_TD} data-label="Email">{u.email}</td>
                        <td className={ADMIN_TD} data-label="Nom">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold ${av.cls}`}
                            >
                              {av.initials}
                            </span>
                            <span>{fullName}</span>
                          </div>
                        </td>
                        <td className={ADMIN_TD} data-label="Rôle">
                          {isAdmin ? (
                            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-ink-900 text-white">
                              ADMIN
                            </span>
                          ) : (
                            <select
                              className={ADMIN_SELECT}
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
                        <td className={ADMIN_TD} data-label="Email vérifié">
                          <span className={emailVerifiedBadge(u.isEmailVerified)}>
                            {u.isEmailVerified ? 'Vérifié' : 'Non vérifié'}
                          </span>
                        </td>
                        <td className={ADMIN_TD} data-label="Solde">
                          <div className="flex items-center gap-1">
                            <Coin size={16} />
                            <span>{u.balance}</span>
                          </div>
                        </td>
                        <td className={ADMIN_TD} data-label="Actions">
                          <div className={ADMIN_ACTIONS}>
                            {u.isEmailVerified ? (
                              <button
                                className={ADMIN_BTN_LINK}
                                disabled={busy}
                                onClick={() => patchUser(u, { isEmailVerified: false }, 'Email révoqué.')}
                              >
                                Rejeter
                              </button>
                            ) : (
                              <button
                                className={ADMIN_BTN_LINK}
                                disabled={busy}
                                onClick={() => patchUser(u, { isEmailVerified: true }, 'Email vérifié.')}
                              >
                                Approuver
                              </button>
                            )}
                            <button
                              className={ADMIN_BTN_DANGER}
                              disabled={busy}
                              onClick={() => remove(u)}
                            >
                              <Icon name="trash" size={14} className="mr-1" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={ADMIN_PAGINATION}>
              <button
                className={ADMIN_BTN_GHOST}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </button>
              <span className={ADMIN_PAGE_INFO}>
                Page {page} · {total} utilisateur{total > 1 ? 's' : ''}
              </span>
              <button
                className={ADMIN_BTN_GHOST}
                disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
                <Icon name="chevron-right" size={14} className="ml-1" />
              </button>
            </div>
          </>
        )
      )}
      {confirmDialog}
    </div>
  );
}
