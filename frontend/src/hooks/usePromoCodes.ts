import { useRef, useState } from 'react';
import { addPromoCodes, listPromoCodes, deletePromoCode } from '@/services/api';
import type { AdminPromoCode } from '@/services/api';
import type { Offer } from '@/types/types';
import type { ConfirmFn } from '@/components/ui/ConfirmDialog';

type Opts = {
  confirm: ConfirmFn;
  flash: (msg: string) => void;
  reload: () => Promise<void>;      // refreshes the list's stock counters
  setError: (msg: string) => void;  // global error banner (401 path)
  onAuthExpired: () => void;
};

// "Gérer les codes" panel: open for one offer at a time (list + import + delete).
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
      reload(); // refresh the stock counters
    } else if (res.status === 409) {
      setCodesError('Ce code a déjà été utilisé, impossible de le supprimer.');
    } else {
      setCodesError('Impossible de supprimer ce code.');
    }
    // Whatever the outcome, resync the displayed list.
    if (openId) {
      const r = await listPromoCodes(openId);
      if (r.ok && r.data) setList(r.data.codes);
    }
  };

  // Read a CSV file in the browser and fill the textarea with the codes (one per line).
  // Handles newline, comma and semicolon separators, and skips an optional "code" header row.
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodesError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const codes = raw
        .split(/[\r\n,;]+/)        // newlines, commas or semicolons
        .map((c) => c.trim())
        .filter((c) => c.length > 0 && c.toLowerCase() !== 'code'); // skip an optional header
      if (codes.length === 0) {
        setCodesError('Aucun code trouvé dans le fichier.');
      } else {
        setText(codes.join('\n')); // the admin reviews before adding
      }
    };
    reader.onerror = () => setCodesError('Impossible de lire le fichier.');
    reader.readAsText(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  const addCodes = async (offer: Offer) => {
    setCodesError('');
    // Split on newline, comma or semicolon (same logic as the CSV import).
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
        flash(`${res.data.added} code(s) ajouté(s), ${res.data.skipped} ignoré(s).`);
        setText('');
        setOpenId(null);
        reload(); // refresh the stock badge
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
