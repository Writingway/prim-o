import { CATEGORY_LABELS } from '@/services/api';
import { useDistributeForm } from '@/hooks/useDistributeForm';

// §3.3 — Formulaire de distribution manager → employé.
// Employé + montant + sélecteur de motif (4 catégories) + note libre optionnelle
// → POST /attributions → confirmation gamifiée avec le compliment renvoyé.
// Logique extraite dans useDistributeForm ; ce composant = rendu pur.

type EmployeeLite = { id: string; firstName: string; lastName: string };

type Props = {
  employees: EmployeeLite[];
  onDone: () => void; // recharge soldes/historique après succès
};

export default function DistributeForm({ employees, onDone }: Props) {
  const {
    cats, loadingMotifs,
    employeeId, setEmployeeId,
    amount, setAmount,
    motifId, setMotifId,
    reason, setReason,
    error, submitting, done,
    submit, reset,
  } = useDistributeForm(onDone);

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
          onClick={reset}
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
