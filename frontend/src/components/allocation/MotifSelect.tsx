import type { MotifCategoryGroup } from '../../types/types';
import { MOTIF_CATEGORY_LABELS } from '../../types/types';
import { ALLOC_INPUT } from '../dashboard/dashStyles';

type Props = {
  groups: MotifCategoryGroup[];
  value: string;            // selected motifId ('' = none)
  onChange: (motifId: string) => void;
  disabled?: boolean;
};

// Required motif (allocation reason) selector; options grouped by category from the official list.
export default function MotifSelect({ groups, value, onChange, disabled }: Props) {
  return (
    <select
      className={`${ALLOC_INPUT} min-w-[190px]`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">- motif -</option>
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
