import { useState } from 'react';
import type { ManagerEnvelope, MotifCategoryGroup, Employee, DistributeLine } from '../../types/types';
import { MODE_LABELS } from '../../types/types';
import { distributeEnvelope } from '../../services/api';
import MotifSelect from './MotifSelect';
import Icon from '../ui/Icon';
import { RB, RB_HEADER, RB_STATS, RB_STAT, RB_STAT_LABEL, RB_STAT_VALUE, RB_STAT_REST, RB_STAT_VALUE_OK, RB_LIST, RB_ROW, RB_NAME, RB_ACTIONS, EMP_LIST, EMP_AVATAR, EMP_ATTRIB_ERROR, EMP_ATTRIB_SUBMIT, ALLOC_INPUT, ALLOC_MODE_HINT } from '../dashboard/dashStyles';

const CANCEL_BTN =
  'cursor-pointer rounded-[12px] border-[1.5px] border-primo-line bg-white px-4 py-2.5 text-sm font-bold text-primo-slate transition hover:bg-white disabled:opacity-55';

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
    <div className={RB}>
      <div className={RB_HEADER}>
        <Icon name="envelope" size={18} /> Enveloppe {envelope.amount} · {modeLabel}
      </div>

      <div className={RB_STATS}>
        <div className={RB_STAT}><span className={RB_STAT_LABEL}>Ma part (auto)</span><strong className={RB_STAT_VALUE}>{envelope.retributionAmount}</strong></div>
        <div className={RB_STAT}><span className={RB_STAT_LABEL}>Budget équipe</span><strong className={RB_STAT_VALUE}>{budget}</strong></div>
        <div className={`${RB_STAT} ${RB_STAT_REST}`}>
          <span className={RB_STAT_LABEL}>Reste à distribuer</span><strong className={`${RB_STAT_VALUE}${remaining === 0 ? ` ${RB_STAT_VALUE_OK}` : ''}`}>{remaining}</strong>
        </div>
      </div>

      <div className={`${EMP_ATTRIB_ERROR} min-h-0`}>{error}</div>

      <ul className={`${EMP_LIST} ${RB_LIST}`}>
        {employees.map((e) => (
          <li className={RB_ROW} key={e.id}>
            <div className={EMP_AVATAR}>
              {`${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()}
            </div>
            <div className={RB_NAME}>{e.firstName} {e.lastName}</div>
            <input
              className={`${ALLOC_INPUT} w-[96px]`}
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

      <div className={RB_ACTIONS}>
        <button type="button" className={CANCEL_BTN} onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        <button type="button" className={EMP_ATTRIB_SUBMIT} onClick={submit} disabled={!canSend}>
          {submitting ? '…' : <><Icon name="send" size={16} /> Envoyer</>}
        </button>
      </div>
      {remaining !== 0 && (
        <p className={`${ALLOC_MODE_HINT} text-right`}>
          « Envoyer » s'active quand le reste = 0.
        </p>
      )}
    </div>
  );
}
