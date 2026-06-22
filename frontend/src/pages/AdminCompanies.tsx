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
  ADMIN_BADGE_INACTIVE,
  ADMIN_BTN_DANGER,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LINK,
  ADMIN_BTN_PRIMARY,
  ADMIN_ERROR,
  ADMIN_FORM_ERROR,
  ADMIN_INLINE_FORM,
  ADMIN_INPUT,
  ADMIN_MSG,
  ADMIN_NOTICE,
  ADMIN_PAGE_INFO,
  ADMIN_PAGINATION,
  ADMIN_TABLE,
  ADMIN_TABLE_SCROLL,
  ADMIN_TD,
  ADMIN_TH,
} from './adminClasses';

const PAGE_SIZE = 20;

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

  // Création
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Undo : après une suppression, on garde l'id pour pouvoir restaurer
  // (listCompanies ne renvoie pas les supprimées → seul ce chemin expose restore).
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
        // 409 = un email a été réutilisé entre-temps → restauration impossible.
        setError((res.data as { error?: string } | null)?.error ?? 'Restauration impossible.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  return (
    <div>
      <form className={ADMIN_INLINE_FORM} onSubmit={create}>
        <input
          className={ADMIN_INPUT}
          type="text"
          placeholder="Nom de la nouvelle entreprise"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className={ADMIN_BTN_PRIMARY} disabled={creating}>
          {creating ? 'Création…' : 'Créer'}
        </button>
      </form>
      {formError && <p className={ADMIN_FORM_ERROR}>{formError}</p>}

      {lastDeleted && (
        <p className={ADMIN_NOTICE}>
          « {lastDeleted.name} » supprimée.
          <button className={ADMIN_BTN_LINK} onClick={undoDelete}>Annuler</button>
        </p>
      )}

      {loading && <p className={ADMIN_MSG}>Chargement…</p>}
      {error && <p className={`${ADMIN_MSG} ${ADMIN_ERROR}`}>{error}</p>}

      {!loading && companies && (
        companies.length === 0 ? (
          <p className={ADMIN_MSG}>Aucune entreprise.</p>
        ) : (
          <>
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
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td className={ADMIN_TD} data-label="Nom">{c.name}</td>
                      <td className={ADMIN_TD} data-label="Statut">
                        <span className={c.status === 'APPROVED' ? 'bg-primo-teal-soft text-primo-teal-dark inline-flex rounded-full px-2 py-0.5 text-xs font-semibold' : ADMIN_BADGE_INACTIVE}>
                          {c.status === 'APPROVED' ? 'Validée' : c.status === 'PENDING' ? 'En attente' : 'Rejetée'}
                        </span>
                      </td>
                      <td className={ADMIN_TD} data-label="Solde pool">{c.tokenBalance}</td>
                      <td className={ADMIN_TD} data-label="Utilisateurs">{c._count.users}</td>
                      <td className={ADMIN_TD} data-label="Créée le">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className={ADMIN_TD} data-label="Actions">
                        <div className={ADMIN_ACTIONS}>
                        {c.status !== 'APPROVED' && (
                          <button className={ADMIN_BTN_LINK} disabled={busyId === c.id}
                            onClick={() => changeStatus(c, 'APPROVED')}>
                            Valider
                          </button>
                        )}
                        {c.status === 'PENDING' && (
                          <button className={ADMIN_BTN_DANGER} disabled={busyId === c.id}
                            onClick={() => changeStatus(c, 'REJECTED')}>
                            Rejeter
                          </button>
                        )}
                        <button className={ADMIN_BTN_DANGER} disabled={busyId === c.id}
                          onClick={() => remove(c)}>
                          Supprimer
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={ADMIN_PAGINATION}>
              <button className={ADMIN_BTN_GHOST} disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                 Précédent
              </button>
              <span className={ADMIN_PAGE_INFO}>
                Page {page} · {total} entreprise{total > 1 ? 's' : ''}
              </span>
              <button className={ADMIN_BTN_GHOST} disabled={!hasMore || loading}
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
