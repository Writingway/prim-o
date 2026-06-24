import { useState } from 'react';
import { createOffer, updateOffer } from '@/services/api';
import type { Offer } from '@/types/types';

// Form vide pour une nouvelle offre.
const emptyForm = { partnerName: '', cost: '', discountPercent: '', categoryId: '' };

type Opts = {
  reload: () => Promise<void>;
  flash: (msg: string) => void;
};

// Panneau de création/édition d'offre. editingId === null → création.
export function useOfferForm({ reload, flash }: Opts) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      partnerName: offer.partnerName,
      cost: String(offer.cost),
      discountPercent: String(offer.discountPercent),
      categoryId: offer.category?.id ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const cost = Number(form.cost);
    const discountPercent = Number(form.discountPercent);
    if (!form.partnerName.trim()) return setFormError('Le nom du partenaire est requis.');
    if (isNaN(cost) || cost < 0) return setFormError('Coût invalide.');
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100)
      return setFormError('Réduction invalide (0-100).');
    if (!form.categoryId.trim()) return setFormError('La catégorie est requise.');

    setSaving(true);
    try {
      const payload = {
        partnerName: form.partnerName.trim(),
        cost,
        discountPercent,
        categoryId: form.categoryId,
      };
      const res = editingId
        ? await updateOffer(editingId, payload)
        : await createOffer(payload);

      if (res.ok) {
        flash(editingId ? 'Offre mise à jour.' : 'Offre créée.');
        closeForm();
        reload();
      } else if (res.status === 401) {
        setFormError('Session expirée, reconnecte-toi.');
      } else {
        setFormError("Erreur lors de l'enregistrement de l'offre.");
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  };

  return { showForm, editingId, form, setForm, formError, saving, openCreate, openEdit, closeForm, submit };
}
