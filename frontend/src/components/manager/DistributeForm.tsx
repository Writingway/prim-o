import { useEffect, useState } from 'react';
import {
  getMotifs,
  distribute,
  CATEGORY_LABELS,
  type MotifDTO,
  type MotifCategory,
  type DistributeResult,
} from '../../services/api';

// §3.3 — Formulaire de distribution manager → employé.
// Employé + montant + sélecteur de motif (4 catégories) + note libre optionnelle
// → POST /attributions → confirmation gamifiée avec le compliment renvoyé.
// Validation = miroir Zod (montant entier > 0, motifId requis). Backend = autorité.

type EmployeeLite = { id: string; firstName: string; lastName: string };

type Props = {
  employees: EmployeeLite[];
  onDone: () => void; // recharge soldes/historique après succès
};

export default function DistributeForm({ employees, onDone }: Props) {
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
      setError("Échec de la distribution.");
    }
  };

  // ─── Confirmation gamifiée ───────────────────────────────────────
  if (done) {
    const emp = employees.find((e) => e.id === done.employeeId);
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-primo-teal to-primo-teal-dark p-6 text-center text-white">
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-bold">
          +{done.amount} jetons envoyés{emp ? ` à ${emp.firstName}` : ''} !
        </p>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {done.motif.tag}
        </span>
        <p className="text-sm italic text-white/90">“{done.motif.compliment}”</p>
        {done.retributionAmount > 0 && (
          <p className="text-sm font-medium text-white/80">
            +{done.retributionAmount} jetons crédités sur ton solde perso
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setEmployeeId('');
            setAmount('');
            setMotifId('');
            setReason('');
          }}
          className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-primo-teal-dark"
        >
          Nouvelle distribution
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-primo-border">
      <h2 className="text-base font-bold text-primo-ink">Distribuer des jetons</h2>

      {/* Employé */}
      <label className="flex flex-col gap-1 text-sm font-medium text-primo-gray">
        Employé
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded-xl border border-primo-border bg-white px-3 py-2 text-primo-ink"
        >
          <option value="">Choisir…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      </label>

      {/* Montant */}
      <label className="flex flex-col gap-1 text-sm font-medium text-primo-gray">
        Montant
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="rounded-xl border border-primo-border bg-white px-3 py-2 text-primo-ink"
        />
      </label>

      {/* Sélecteur de motif (4 catégories) */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-primo-gray">Motif</span>
        {loadingMotifs ? (
          <div className="h-10 rounded-xl bg-primo-teal-soft animate-pulse" />
        ) : (
          <div className="flex flex-col gap-3">
            {cats.map((c) => (
              <div key={c.category} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primo-teal-dark">
                  {CATEGORY_LABELS[c.category]}
                </span>
                <div className="flex flex-wrap gap-2">
                  {c.motifs.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMotifId(m.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        motifId === m.id
                          ? 'bg-primo-teal text-white shadow-sm'
                          : 'bg-primo-teal-soft text-primo-teal-dark'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note libre optionnelle */}
      <label className="flex flex-col gap-1 text-sm font-medium text-primo-gray">
        Note (optionnelle)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Un mot personnel…"
          className="resize-none rounded-xl border border-primo-border bg-white px-3 py-2 text-primo-ink"
        />
      </label>

      {error && <p className="text-sm font-medium text-primo-error">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primo-teal px-5 py-3 text-sm font-bold text-white shadow-sm transition disabled:opacity-60"
      >
        {submitting ? 'Envoi…' : 'Envoyer les jetons'}
      </button>
    </form>
  );
}
