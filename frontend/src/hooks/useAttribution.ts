import { useState } from 'react';
import { createAttribution } from '@/services/api';

// Attribution manager/patron → employé (formulaire inline, un seul ouvert).
export function useAttribution(reload: () => Promise<void>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const open = (id: string) => {
    setOpenId(id);
    setAmount('');
    setReason('');
    setError('');
  };
  const close = () => {
    setOpenId(null);
    setError('');
  };
  const toggle = (id: string) => (openId === id ? close() : open(id));

  const submit = async (employeeId: string) => {
    setError('');
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) {
      setError('Le montant doit être un entier positif.');
      return;
    }
    if (!reason.trim()) {
      setError('La raison est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createAttribution({ employeeId, amount: n, reason: reason.trim() });
      if (res.ok) {
        close();
        await reload(); // recharge la liste → le solde de l'employé est à jour
      } else if (res.status === 409) {
        setError(res.data && 'error' in res.data ? res.data.error : 'Solde de tokens insuffisant.');
      } else if (res.status === 400) {
        setError('Montant et raison obligatoires.');
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError(res.data && 'error' in res.data ? res.data.error : "Échec de l'attribution.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return { openId, amount, setAmount, reason, setReason, error, submitting, open, close, toggle, submit };
}
