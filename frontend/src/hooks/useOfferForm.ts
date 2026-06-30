import { useState } from 'react';
import { createOffer, updateOffer, uploadOfferImage, deleteOfferImage } from '@/services/api';
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
  // Photo : fichier choisi (à uploader), image actuelle (édition), et marqueur
  // de suppression. L'upload se fait APRÈS la création/màj de l'offre (flux 2 temps).
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const resetImage = () => {
    setImageFile(null);
    setCurrentImageUrl(null);
    setRemoveImage(false);
  };

  // L'utilisateur sélectionne un fichier (remplace l'aperçu actuel).
  const pickImage = (file: File | null) => {
    setImageFile(file);
    if (file) setRemoveImage(false);
  };

  // Retire l'image : annule la sélection et, en édition, marque l'existante à supprimer.
  const clearImage = () => {
    setImageFile(null);
    setRemoveImage(!!currentImageUrl);
    setCurrentImageUrl(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    resetImage();
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
    setImageFile(null);
    setRemoveImage(false);
    setCurrentImageUrl(offer.imageUrl ?? null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
    resetImage();
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

      if (!res.ok) {
        if (res.status === 401) setFormError('Session expirée, reconnecte-toi.');
        else setFormError("Erreur lors de l'enregistrement de l'offre.");
        return;
      }

      // Étape 2 (photo) : sur l'id de l'offre créée/éditée. L'offre est déjà
      // enregistrée → un échec ici n'annule pas l'offre, on le signale juste.
      const offerId = editingId ?? res.data?.offer.id;
      let imageWarning = '';
      if (offerId) {
        if (imageFile) {
          const up = await uploadOfferImage(offerId, imageFile);
          if (!up.ok) imageWarning = " (mais l'image n'a pas pu être envoyée)";
        } else if (editingId && removeImage) {
          await deleteOfferImage(offerId);
        }
      }

      flash((editingId ? 'Offre mise à jour' : 'Offre créée') + imageWarning + '.');
      closeForm();
      reload();
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  };

  return {
    showForm, editingId, form, setForm, formError, saving,
    imageFile, currentImageUrl, pickImage, clearImage,
    openCreate, openEdit, closeForm, submit,
  };
}
