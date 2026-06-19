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
    <div className="admin-companies">
      <form className="admin-form admin-inline-form" onSubmit={create}>
        <input
          type="text"
          placeholder="Nom de la nouvelle entreprise"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="admin-btn-primary" disabled={creating}>
          {creating ? 'Création…' : 'Créer'}
        </button>
      </form>
      {formError && <p className="admin-form-error">{formError}</p>}

      {lastDeleted && (
        <p className="admin-notice">
          « {lastDeleted.name} » supprimée.
          <button className="admin-btn-link" onClick={undoDelete}>Annuler</button>
        </p>
      )}

      {loading && <p className="admin-msg">Chargement…</p>}
      {error && <p className="admin-msg admin-error">{error}</p>}

      {!loading && companies && (
        companies.length === 0 ? (
          <p className="admin-msg">Aucune entreprise.</p>
        ) : (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Statut</th>
                    <th>Solde pool</th>
                    <th>Utilisateurs</th>
                    <th>Créée le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Nom">{c.name}</td>
                      <td data-label="Statut">
                        <span className={`admin-badge ${c.status === 'APPROVED' ? 'active' : 'inactive'}`}>
                          {c.status === 'APPROVED' ? 'Validée' : c.status === 'PENDING' ? 'En attente' : 'Rejetée'}
                        </span>
                      </td>
                      <td data-label="Solde pool">{c.tokenBalance}</td>
                      <td data-label="Utilisateurs">{c._count.users}</td>
                      <td data-label="Créée le">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="admin-actions" data-label="Actions">
                        {c.status !== 'APPROVED' && (
                          <button className="admin-btn-link" disabled={busyId === c.id}
                            onClick={() => changeStatus(c, 'APPROVED')}>
                            Valider
                          </button>
                        )}
                        {c.status === 'PENDING' && (
                          <button className="admin-btn-link admin-btn-danger" disabled={busyId === c.id}
                            onClick={() => changeStatus(c, 'REJECTED')}>
                            Rejeter
                          </button>
                        )}
                        <button className="admin-btn-link admin-btn-danger" disabled={busyId === c.id}
                          onClick={() => remove(c)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button className="admin-btn-ghost" disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                 Précédent
              </button>
              <span className="admin-page-info">
                Page {page} · {total} entreprise{total > 1 ? 's' : ''}
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
