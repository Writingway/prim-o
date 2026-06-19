import { useState } from 'react';
import { allocateTokens } from '@/services/api';

// Allocation patron → manager (formulaire inline, un seul ouvert).
export function useAllocation(reload: () => Promise<void>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const open = (id: string) => {
    setOpenId(id);
    setAmount('');
    setError('');
  };
  const toggle = (id: string) => (openId === id ? setOpenId(null) : open(id));

  const submit = async (managerId: string) => {
    setError('');
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) {
      setError('Le montant doit être un entier positif.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await allocateTokens(managerId, n);
      if (res.ok) {
        setOpenId(null);
        await reload(); // rafraîchit pool + soldes managers
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError(res.data && 'error' in res.data ? res.data.error : "Échec de l'allocation.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return { openId, setOpenId, amount, setAmount, error, submitting, open, toggle, submit };
}
