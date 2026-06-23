import type { MotifCategoryGroup } from '../../types/types';
import { MOTIF_CATEGORY_LABELS } from '../../types/types';
import { ALLOC_INPUT } from '../dashboard/dashStyles';

type Props = {
  groups: MotifCategoryGroup[];
  value: string;            // motifId sélectionné ('' = aucun)
  onChange: (motifId: string) => void;
  disabled?: boolean;
};

// Sélecteur de motif obligatoire, options groupées par catégorie (liste officielle).
export default function MotifSelect({ groups, value, onChange, disabled }: Props) {
  return (
    <select
      className={`${ALLOC_INPUT} min-w-[190px]`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— motif —</option>
      {groups.map((g) => (
        <optgroup key={g.category} label={MOTIF_CATEGORY_LABELS[g.category]}>
          {g.motifs.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
