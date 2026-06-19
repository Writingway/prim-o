import { useRef, useState } from 'react';
import { addPromoCodes, listPromoCodes, deletePromoCode } from '@/services/api';
import type { AdminPromoCode } from '@/services/api';
import type { Offer } from '@/types/types';
import type { ConfirmFn } from '@/components/ui/ConfirmDialog';

type Opts = {
  confirm: ConfirmFn;
  flash: (msg: string) => void;
  reload: () => Promise<void>;      // rafraîchit les compteurs de stock de la liste
  setError: (msg: string) => void;  // bannière d'erreur globale (chemin 401)
  onAuthExpired: () => void;
};

// Panneau « Gérer les codes » : ouvert pour une offre à la fois (lecture + import + suppression).
export function usePromoCodes({ confirm, flash, reload, setError, onAuthExpired }: Opts) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setCodesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<AdminPromoCode[] | null>(null);
  const [listLoading, setListLoading] = useState(false);

  const toggle = async (offerId: string) => {
    const opening = openId !== offerId;
    setOpenId(opening ? offerId : null);
    setText('');
    setCodesError('');
    setList(null);
    if (opening) {
      setListLoading(true);
      try {
        const res = await listPromoCodes(offerId);
        if (res.ok && res.data) setList(res.data.codes);
      } finally {
        setListLoading(false);
      }
    }
  };

  const deleteCode = async (codeId: string) => {
    setCodesError('');
    const ok = await confirm({
      title: 'Supprimer ce code ?',
      message: 'Ce code disponible sera définitivement supprimé.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    const res = await deletePromoCode(codeId);
    if (res.ok) {
      flash('Code supprimé.');
      reload(); // rafraîchit les compteurs de stock
    } else if (res.status === 409) {
      setCodesError('Ce code a déjà été utilisé, impossible de le supprimer.');
    } else {
      setCodesError('Impossible de supprimer ce code.');
    }
    // Dans tous les cas, on resynchronise la liste affichée.
    if (openId) {
      const r = await listPromoCodes(openId);
      if (r.ok && r.data) setList(r.data.codes);
    }
  };

  // Lit un fichier CSV côté navigateur et remplit le textarea avec les codes
  // (un par ligne). On gère le séparateur ligne ET virgule, et on ignore une
  // éventuelle ligne d'en-tête « code ».
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodesError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const codes = raw
        .split(/[\r\n,;]+/)        // lignes, virgules ou points-virgules
        .map((c) => c.trim())
        .filter((c) => c.length > 0 && c.toLowerCase() !== 'code'); // saute l'en-tête éventuel
      if (codes.length === 0) {
        setCodesError('Aucun code trouvé dans le fichier.');
      } else {
        setText(codes.join('\n')); // l'admin vérifie avant d'ajouter
      }
    };
    reader.onerror = () => setCodesError('Impossible de lire le fichier.');
    reader.readAsText(file);
    e.target.value = ''; // permet de re-sélectionner le même fichier
  };

  const addCodes = async (offer: Offer) => {
    setCodesError('');
    // Découpe sur retour à la ligne, virgule ou point-virgule (même logique que le CSV).
    const codes = text
      .split(/[\r\n,;]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (codes.length === 0) {
      setCodesError('Colle au moins un code (un par ligne).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await addPromoCodes(offer.id, codes);
      if (res.ok && res.data) {
        flash(`✅ ${res.data.added} code(s) ajouté(s), ${res.data.skipped} ignoré(s).`);
        setText('');
        setOpenId(null);
        reload(); // rafraîchit le badge de stock
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        onAuthExpired();
      } else if (res.status === 404) {
        setCodesError('Offre introuvable.');
      } else {
        setCodesError("Impossible d'ajouter les codes.");
      }
    } catch {
      setCodesError('Impossible de joindre le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    openId, text, setText, error, submitting, csvInputRef, list, listLoading,
    toggle, deleteCode, handleCsvFile, addCodes,
  };
}
