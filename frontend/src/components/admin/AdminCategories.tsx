import { useState, useEffect } from 'react';
import type { Category } from '@/types/types';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { listAdminCategories, createCategory, updateCategory, deactivateCategory } from '@/services/api/categories';
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_LINK,
  ADMIN_BADGE_ACTIVE,
  ADMIN_BADGE_INACTIVE,
  ADMIN_TABLE,
  ADMIN_FORM_ERROR,
  ADMIN_MSG,
  ADMIN_ACTIONS,
  ADMIN_INPUT,
  ADMIN_SELECT,
  ADMIN_FORM_ACTIONS,
  ADMIN_BTN_DANGER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TH,
  ADMIN_TD,
} from '@/pages/adminClasses';

const ICON_OPTIONS: IconName[] = [
  'coffee', 'gift', 'ticket', 'plane', 'heart', 'star', 'home',
  'building', 'users', 'bell', 'search', 'flame', 'trophy', 'shield', 'settings',
];

type Props = { flash: (msg: string) => void };

type FormState = {
  label: string;
  slug: string;
  icon: IconName;
  color: string;
  sortOrder: string;
};

const emptyForm: FormState = {
  label: '',
  slug: '',
  icon: 'gift',
  color: '#00a19a',
  sortOrder: '0',
};

export default function AdminCategories({ flash }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listAdminCategories()
      .then((res) => {
        if (res.ok && res.data) setCategories(res.data.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      label: cat.label,
      slug: cat.slug,
      icon: cat.icon as IconName,
      color: cat.color,
      sortOrder: String(cat.sortOrder ?? 0),
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    if (!form.label.trim()) return setFormError('Le libellé est requis.');
    if (!editingId && !form.slug.trim()) return setFormError('Le slug est requis.');
    if (!editingId && !/^[a-z0-9-]+$/.test(form.slug)) return setFormError('Slug invalide (minuscules, chiffres, tirets uniquement).');

    setSaving(true);
    try {
      const sortOrder = parseInt(form.sortOrder, 10) || 0;
      let res;
      if (editingId) {
        res = await updateCategory(editingId, {
          label: form.label.trim(),
          icon: form.icon,
          color: form.color,
          sortOrder,
        });
      } else {
        res = await createCategory({
          label: form.label.trim(),
          slug: form.slug.trim(),
          icon: form.icon,
          color: form.color,
          sortOrder,
        });
      }

      if (res.ok) {
        flash(editingId ? 'Catégorie mise à jour.' : 'Catégorie créée.');
        closeForm();
        load();
      } else if (res.status === 401) {
        setFormError('Session expirée, reconnecte-toi.');
      } else {
        setFormError("Erreur lors de l'enregistrement de la catégorie.");
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (cat: Category) => {
    try {
      const res = await deactivateCategory(cat.id);
      if (res.ok) {
        flash(`Catégorie « ${cat.label} » désactivée.`);
        load();
      }
    } catch {
      flash('Erreur lors de la désactivation.');
    }
  };

  const handleReactivate = async (cat: Category) => {
    try {
      const res = await updateCategory(cat.id, { isActive: true });
      if (res.ok) {
        flash(`Catégorie « ${cat.label} » réactivée.`);
        load();
      }
    } catch {
      flash('Erreur lors de la réactivation.');
    }
  };

  return (
    <div className="rounded-2xl border border-primo-line bg-white p-5 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-primo-ink">Catégories</h2>
          <span className="rounded-full bg-primo-teal-soft px-2.5 py-0.5 text-[12px] font-semibold text-primo-teal-dark">
            {categories.length}
          </span>
        </div>
        {!showForm && (
          <button className={ADMIN_BTN_PRIMARY} type="button" onClick={openCreate}>
            + Nouvelle catégorie
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <form className="rounded-2xl border border-primo-line bg-white p-5 mb-5" onSubmit={handleSubmit}>
          <h2 className="text-[15px] font-extrabold text-primo-ink mb-4">
            {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
              Libellé *
              <input
                className={ADMIN_INPUT}
                type="text"
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex. Restauration"
              />
            </label>

            {!editingId && (
              <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
                Slug *
                <input
                  className={ADMIN_INPUT}
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Ex. restauration"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
              Icône
              <select
                className={ADMIN_SELECT}
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value as IconName })}
              >
                {ICON_OPTIONS.map((ico) => (
                  <option key={ico} value={ico}>{ico}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
              Couleur
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-[38px] w-[48px] cursor-pointer rounded-lg border border-primo-line bg-primo-bg p-1"
                />
                <span className="text-sm text-primo-gray font-mono">{form.color}</span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
              Ordre d'affichage
              <input
                className={ADMIN_INPUT}
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </label>

            <div className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
              Aperçu icône
              <div
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px]"
                style={{ backgroundColor: form.color + '33', color: form.color }}
              >
                <Icon name={form.icon} size={20} />
              </div>
            </div>
          </div>

          {formError && <p className={ADMIN_FORM_ERROR}>{formError}</p>}

          <div className={ADMIN_FORM_ACTIONS}>
            <button type="submit" className={ADMIN_BTN_PRIMARY} disabled={saving}>
              {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" className={ADMIN_BTN_GHOST} onClick={closeForm}>Annuler</button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className={ADMIN_MSG}>Chargement…</p>
      ) : categories.length === 0 ? (
        <p className={ADMIN_MSG}>Aucune catégorie pour le moment.</p>
      ) : (
        <div className={ADMIN_TABLE_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead>
              <tr>
                <th className={ADMIN_TH}>Catégorie</th>
                <th className={ADMIN_TH}>Icône</th>
                <th className={ADMIN_TH}>Couleur</th>
                <th className={ADMIN_TH}>Ordre</th>
                <th className={ADMIN_TH}>Statut</th>
                <th className={ADMIN_TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className={cat.isActive === false ? 'bg-[#fafafb] text-primo-gray' : ''}>
                  <td className={ADMIN_TD} data-label="Catégorie">
                    <div className="flex flex-col">
                      <span className="font-semibold">{cat.label}</span>
                      <span className="text-[11px] text-primo-muted font-mono">{cat.slug}</span>
                    </div>
                  </td>
                  <td className={ADMIN_TD} data-label="Icône">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-[8px]"
                      style={{ backgroundColor: cat.color + '33', color: cat.color }}
                    >
                      <Icon name={cat.icon as IconName} size={16} />
                    </div>
                  </td>
                  <td className={ADMIN_TD} data-label="Couleur">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-5 w-5 rounded-md border border-primo-line"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-mono text-[11px] text-primo-muted">{cat.color}</span>
                    </div>
                  </td>
                  <td className={ADMIN_TD} data-label="Ordre">{cat.sortOrder ?? 0}</td>
                  <td className={ADMIN_TD} data-label="Statut">
                    {cat.isActive !== false ? (
                      <span className={ADMIN_BADGE_ACTIVE}>Actif</span>
                    ) : (
                      <span className={ADMIN_BADGE_INACTIVE}>Inactif</span>
                    )}
                  </td>
                  <td className={ADMIN_TD} data-label="Actions">
                    <div className={ADMIN_ACTIONS}>
                      <button className={ADMIN_BTN_LINK} type="button" onClick={() => openEdit(cat)}>
                        Modifier
                      </button>
                      {cat.isActive !== false ? (
                        <button className={ADMIN_BTN_DANGER} type="button" onClick={() => handleDeactivate(cat)}>
                          Désactiver
                        </button>
                      ) : (
                        <button className={ADMIN_BTN_LINK} type="button" onClick={() => handleReactivate(cat)}>
                          Réactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
