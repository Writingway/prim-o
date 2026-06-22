import { useEffect, useState } from 'react';
import {
  getMotifs,
  distribute,
  type MotifDTO,
  type MotifCategory,
  type DistributeResult,
} from '@/services/api';

// Logique du formulaire de distribution manager → employé (§3.3) :
// chargement des motifs + état du form + validation (miroir Zod) + submit + reset.
export function useDistributeForm(onDone: () => void) {
  const [cats, setCats] = useState<Array<{ category: MotifCategory; motifs: MotifDTO[] }>>([]);
  const [loadingMotifs, setLoadingMotifs] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [motifId, setMotifId] = useState('');
  const [reason, setReason] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<DistributeResult | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await getMotifs();
      if (!alive) return;
      if (res.ok && res.data) setCats(res.data.categories);
      else setError('Impossible de charger les motifs.');
      setLoadingMotifs(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reset = () => {
    setDone(null);
    setEmployeeId('');
    setAmount('');
    setMotifId('');
    setReason('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Miroir Zod : montant entier > 0.
    const amt = Number(amount);
    if (!Number.isInteger(amt) || amt <= 0) {
      setError('Le montant doit être un entier positif.');
      return;
    }
    if (!employeeId) {
      setError('Choisis un employé.');
      return;
    }
    if (!motifId) {
      setError('Choisis un motif.');
      return;
    }

    setSubmitting(true);
    const res = await distribute({
      employeeId,
      amount: amt,
      motifId,
      reason: reason.trim() || undefined,
    });
    setSubmitting(false);

    if (res.ok && res.data) {
      setDone(res.data);
      onDone();
    } else if (res.status === 409) {
      setError('Enveloppe insuffisante pour ce montant.');
    } else if (res.status === 400) {
      setError('Employé, montant et motif obligatoires.');
    } else if (res.status === 401) {
      setError('Session expirée, reconnecte-toi.');
    } else {
      setError('Échec de la distribution.');
    }
  };

  return {
    cats, loadingMotifs,
    employeeId, setEmployeeId,
    amount, setAmount,
    motifId, setMotifId,
    reason, setReason,
    error, submitting, done,
    submit, reset,
  };
}
