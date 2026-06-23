import Icon from '@/components/ui/Icon';
import type { NavItem } from '@/hooks/useBottomNav';

// Barre d'onglets bas (mobile-first) — composant de présentation contrôlé.
// Les items + l'état actif viennent de useBottomNav (config partagée). Actif =
// teal, inactif = muted. Icônes linéaires Prim'O, plus d'emoji.
type Props = {
  items: NavItem[];
  active: string;
  onSelect: (item: NavItem) => void;
};

export default function BottomNav({ items, active, onSelect }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-primo-line bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const on = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item)}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition ${
              on ? 'font-bold text-primo-teal' : 'font-semibold text-primo-muted'
            }`}
          >
            <Icon name={item.icon} size={23} strokeWidth={on ? 1.95 : 1.8} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
