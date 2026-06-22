import { useState } from 'react';
import type { ManagerEnvelope, MotifCategoryGroup, Employee, DistributeLine } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import { distributeEnvelope } from '../../services/api';
import MotifSelect from './MotifSelect';

type Props = {
  envelope: ManagerEnvelope;
  employees: Employee[];
  motifGroups: MotifCategoryGroup[];
  onCancel: () => void;
  onDistributed: () => void; // recharge la vue après succès
};

type Row = { amount: string; motifId: string };

const parseAmount = (s: string) => {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : 0;
};

// Bloc d'ouverture d'une enveloppe : répartition complète + atomique vers les employés.
export default function RedistributionBlock({
  envelope, employees, motifGroups, onCancel, onDistributed,
}: Props) {
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(employees.map((e) => [e.id, { amount: '', motifId: '' }])),
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const budget = envelope.distributableBudget;
  const totalAllocated = employees.reduce((sum, e) => sum + parseAmount(rows[e.id]?.amount ?? ''), 0);
  const remaining = budget - totalAllocated;

  // Lignes réellement créditées (montant > 0).
  const activeLines = employees.filter((e) => parseAmount(rows[e.id]?.amount ?? '') > 0);
  const allActiveHaveMotif = activeLines.every((e) => rows[e.id]?.motifId);
  const canSend = remaining === 0 && activeLines.length > 0 && allActiveHaveMotif && !submitting;

  const setAmount = (id: string, value: string) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], amount: value.replace(/[^0-9]/g, '') } }));
  const setMotif = (id: string, motifId: string) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], motifId } }));

  const submit = async () => {
    setError('');
    const lines: DistributeLine[] = activeLines.map((e) => ({
      employeeId: e.id,
      amount: parseAmount(rows[e.id].amount),
      motifId: rows[e.id].motifId,
    }));
    setSubmitting(true);
    try {
      const res = await distributeEnvelope({ allocationId: envelope.allocationId, lines });
      if (res.ok) {
        onDistributed();
        return;
      }
      const msg = res.data && 'error' in res.data ? res.data.error : null;
      if (res.status === 409) setError(msg ?? 'Cette enveloppe a déjà été distribuée.');
      else if (res.status === 401) setError('Session expirée, reconnecte-toi.');
      else setError(msg ?? "Échec de l'envoi.");
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  const modeLabel = envelope.mode === 'POURCENTAGE'
    ? `${MODE_LABELS.POURCENTAGE} ${envelope.percentage}%`
    : MODE_LABELS[envelope.mode];

  return (
    <div className="rb">
      <div className="rb-header">
        ✉️ Enveloppe {envelope.amount} · {modeLabel}
      </div>

      <div className="rb-stats">
        <div className="rb-stat"><span>Ma part (auto)</span><strong>{envelope.retributionAmount}</strong></div>
        <div className="rb-stat"><span>Budget équipe</span><strong>{budget}</strong></div>
        <div className={`rb-stat rb-stat-rest${remaining === 0 ? ' is-ok' : ''}`}>
          <span>Reste à distribuer</span><strong>{remaining}</strong>
        </div>
      </div>

      <div className="emp-attrib-error" style={{ minHeight: 0 }}>{error}</div>

      <ul className="emp-list rb-list">
        {employees.map((e) => (
          <li className="emp-item rb-row" key={e.id}>
            <div className="emp-avatar">
              {`${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()}
            </div>
            <div className="rb-name">{e.firstName} {e.lastName}</div>
            <input
              className="alloc-input rb-amount"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={rows[e.id]?.amount ?? ''}
              onChange={(ev) => setAmount(e.id, ev.target.value)}
            />
            <MotifSelect
              groups={motifGroups}
              value={rows[e.id]?.motifId ?? ''}
              onChange={(motifId) => setMotif(e.id, motifId)}
              disabled={parseAmount(rows[e.id]?.amount ?? '') === 0}
            />
          </li>
        ))}
      </ul>

      <div className="rb-actions">
        <button type="button" className="app-btn app-btn-ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        <button type="button" className="emp-attrib-submit" onClick={submit} disabled={!canSend}>
          {submitting ? '…' : 'Envoyer ✓'}
        </button>
      </div>
      {remaining !== 0 && (
        <p className="alloc-mode-hint" style={{ textAlign: 'right' }}>
          « Envoyer » s'active quand le reste = 0.
        </p>
      )}
    </div>
  );
}
