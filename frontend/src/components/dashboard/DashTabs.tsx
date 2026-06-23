import { DASH_TABS, DASH_TAB, DASH_TAB_ACTIVE } from './dashStyles';

type Tab<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  tabs: Tab<K>[];
  active: K;
  onSelect: (key: K) => void;
};

// Onglets de dashboard. Générique sur la clé pour rester typé côté Manager/Owner.
export default function DashTabs<K extends string>({ tabs, active, onSelect }: Props<K>) {
  return (
    <div className={DASH_TABS}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`${DASH_TAB}${active === t.key ? ` ${DASH_TAB_ACTIVE}` : ''}`}
          onClick={() => onSelect(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
