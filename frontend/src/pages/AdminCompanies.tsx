import { useCallback, useEffect, useState } from 'react';
import {
  listAdminCompanies,
  createAdminCompany,
  deleteAdminCompany,
  restoreAdminCompany,
  setCompanyStatus,
} from '../services/api';
import type { AdminCompany } from '../types/types';
import { useConfirm } from '../components/ui/ConfirmDialog';
import {
  ADMIN_ACTIONS,
  ADMIN_BTN_DANGER,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LINK,
  ADMIN_BTN_PRIMARY,
  ADMIN_FORM_ERROR,
  ADMIN_INPUT,
  ADMIN_TABLE,
  ADMIN_TABLE_SCROLL,
  ADMIN_TD,
  ADMIN_TH,
} from './adminClasses';
import Icon from '@/components/ui/Icon';
import Coin from '@/components/ui/Coin';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 20;

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

type AdminCompaniesProps = { onFlash: (msg: string) => void };

export default function AdminCompanies({ onFlash }: AdminCompaniesProps) {
  const { confirm, confirmDialog } = useConfirm();
  const [companies, setCompanies] = useState<AdminCompany[] | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [lastDeleted, setLastDeleted] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listAdminCompanies(page, PAGE_SIZE);
      if (res.ok && res.data) {
        setCompanies(res.data.items);
        setTotal(res.data.total);
        setHasMore(res.data.hasMore);
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger les entreprises.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return setFormError("Le nom de l'entreprise est requis.");
    setCreating(true);
    try {
      const res = await createAdminCompany(name.trim());
      if (res.ok) {
        onFlash('Entreprise créée.');
        setName('');
        setShowForm(false);
        setPage(1);
        load();
      } else if (res.status === 401) {
        setFormError('Session expirée, reconnecte-toi.');
      } else {
        setFormError((res.data as { error?: string } | null)?.error ?? 'Création impossible.');
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (c: AdminCompany) => {
    const ok = await confirm({
      title: 'Supprimer cette entreprise ?',
      message: `Supprimer « ${c.name} » ? Tous ses utilisateurs seront désactivés.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setBusyId(c.id);
    setError('');
    try {
      const res = await deleteAdminCompany(c.id);
      if (res.ok && res.data) {
        onFlash(`« ${c.name} » supprimée (${res.data.usersDeleted} utilisateur(s)).`);
        setLastDeleted({ id: c.id, name: c.name });
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

  const changeStatus = async (c: AdminCompany, status: 'APPROVED' | 'REJECTED') => {
    const ok = await confirm({
      title: status === 'APPROVED' ? 'Valider cette entreprise ?' : 'Rejeter cette entreprise ?',
      message:
        status === 'APPROVED'
          ? `Valider « ${c.name} » ? Son patron pourra alors recharger le pool de tokens.`
          : `Rejeter « ${c.name} » ?`,
      confirmLabel: status === 'APPROVED' ? 'Valider' : 'Rejeter',
      danger: status === 'REJECTED',
    });
    if (!ok) return;
    setBusyId(c.id);
    setError('');
    try {
      const res = await setCompanyStatus(c.id, status);
      if (res.ok) {
        onFlash(status === 'APPROVED' ? `« ${c.name} » validée.` : `« ${c.name} » rejetée.`);
        load();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError((res.data as { error?: string } | null)?.error ?? 'Action impossible.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
    }
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    const ok = await confirm({
      title: 'Restaurer cette entreprise ?',
      message: `Restaurer « ${lastDeleted.name} » et ses utilisateurs ?`,
      confirmLabel: 'Restaurer',
    });
    if (!ok) return;
    setError('');
    try {
      const res = await restoreAdminCompany(lastDeleted.id);
      if (res.ok && res.data) {
        onFlash(`« ${lastDeleted.name} » restaurée (${res.data.usersRestored} utilisateur(s)).`);
        setLastDeleted(null);
        load();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError((res.data as { error?: string } | null)?.error ?? 'Restauration impossible.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  return (
    <div className="rounded-2xl border border-primo-line bg-white p-5 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-primo-ink">
            Entreprises
          </h2>
          <p className="text-[13px] text-primo-gray">
            {total} entreprise{total !== 1 ? 's' : ''} enregistrée{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primo-teal-soft px-2.5 py-0.5 text-xs font-semibold text-primo-teal-dark">
            {total}
          </span>
          <button
            className={ADMIN_BTN_PRIMARY}
            onClick={() => setShowForm((v) => !v)}
          >
            <Icon name="plus" size={15} className="mr-1" />
            Créer
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-primo-line bg-white p-4 mb-5">
          <form className="flex flex-wrap gap-2" onSubmit={create}>
            <input
              className={`${ADMIN_INPUT} flex-1 min-w-[200px]`}
              type="text"
              placeholder="Nom de la nouvelle entreprise"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className={ADMIN_BTN_PRIMARY} disabled={creating}>
              {creating ? 'Création…' : 'Créer'}
            </button>
            <button
              type="button"
              className={ADMIN_BTN_GHOST}
              onClick={() => { setShowForm(false); setFormError(''); setName(''); }}
            >
              Annuler
            </button>
          </form>
          {formError && <p className={ADMIN_FORM_ERROR}>{formError}</p>}
        </div>
      )}

      {/* Undo restore notice */}
      {lastDeleted && (
        <div className="mb-5 rounded-xl border border-primo-warn-strong/30 bg-primo-warn-soft p-4 flex items-start gap-3">
          <Icon name="alert" size={16} className="mt-0.5 flex-none text-primo-warn-strong" />
          <p className="text-sm text-primo-warn-strong">
            <span className="font-bold">« {lastDeleted.name} »</span> supprimée.{' '}
            <button className={ADMIN_BTN_LINK} onClick={undoDelete}>
              Restaurer
            </button>
          </p>
        </div>
      )}

      {/* Loading / error */}
      {loading && <p className="py-8 text-center text-sm text-primo-gray">Chargement…</p>}
      {error && <p className="py-8 text-center text-sm text-primo-error">{error}</p>}

      {/* Table */}
      {!loading && companies && (
        companies.length === 0 ? (
          <p className="py-8 text-center text-sm text-primo-gray">Aucune entreprise.</p>
        ) : (
          <>
            <div className="rounded-2xl border border-primo-line bg-white overflow-hidden">
              <div className={ADMIN_TABLE_SCROLL}>
                <table className={ADMIN_TABLE}>
                  <thead>
                    <tr>
                      <th className={ADMIN_TH}>Nom</th>
                      <th className={ADMIN_TH}>Statut</th>
                      <th className={ADMIN_TH}>Solde pool</th>
                      <th className={ADMIN_TH}>Utilisateurs</th>
                      <th className={ADMIN_TH}>Créée le</th>
                      <th className={ADMIN_TH}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => {
                      const av = avatarFor(c.name);
                      return (
                        <tr key={c.id}>
                          <td className={ADMIN_TD} data-label="Nom">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold ${av.cls}`}
                              >
                                {av.initials}
                              </span>
                              {c.name}
                            </div>
                          </td>
                          <td className={ADMIN_TD} data-label="Statut">
                            {c.status === 'APPROVED' && (
                              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-success-soft text-primo-success">
                                Validée
                              </span>
                            )}
                            {c.status === 'PENDING' && (
                              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-warn-soft text-primo-warn-strong">
                                En attente
                              </span>
                            )}
                            {c.status === 'REJECTED' && (
                              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-primo-error-soft text-primo-error">
                                Rejetée
                              </span>
                            )}
                          </td>
                          <td className={ADMIN_TD} data-label="Solde pool">
                            <div className="flex items-center gap-1.5">
                              <Coin size={16} />
                              {c.tokenBalance}
                            </div>
                          </td>
                          <td className={ADMIN_TD} data-label="Utilisateurs">
                            <div className="flex items-center gap-1.5">
                              <Icon name="users" size={14} className="text-primo-gray" />
                              {c._count.users}
                            </div>
                          </td>
                          <td className={ADMIN_TD} data-label="Créée le">
                            {formatDate(c.createdAt)}
                          </td>
                          <td className={ADMIN_TD} data-label="Actions">
                            <div className={ADMIN_ACTIONS}>
                              {c.status !== 'APPROVED' && (
                                <button
                                  className={ADMIN_BTN_LINK}
                                  disabled={busyId === c.id}
                                  onClick={() => changeStatus(c, 'APPROVED')}
                                >
                                  <Icon name="check" size={13} className="mr-1" />
                                  Valider
                                </button>
                              )}
                              {c.status === 'PENDING' && (
                                <button
                                  className={ADMIN_BTN_DANGER}
                                  disabled={busyId === c.id}
                                  onClick={() => changeStatus(c, 'REJECTED')}
                                >
                                  Rejeter
                                </button>
                              )}
                              <button
                                className={ADMIN_BTN_DANGER}
                                disabled={busyId === c.id}
                                onClick={() => remove(c)}
                              >
                                <Icon name="trash" size={13} className="mr-1" />
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
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                className="rounded-full border border-primo-line bg-white px-4 py-1.5 text-sm font-semibold text-primo-gray transition hover:bg-primo-surface disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </button>
              <span className="text-sm font-medium text-primo-gray">
                Page {page} · {total} entreprise{total > 1 ? 's' : ''}
              </span>
              <button
                className="rounded-full border border-primo-line bg-white px-4 py-1.5 text-sm font-semibold text-primo-gray transition hover:bg-primo-surface disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </button>
            </div>
          </>
        )
      )}
      {confirmDialog}
    </div>
  );
}
