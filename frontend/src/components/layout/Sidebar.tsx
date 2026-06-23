import type { ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import type { NavItem } from '@/hooks/useBottomNav';

// Sidebar console (desktop lg+ uniquement) — composant de présentation contrôlé.
// Mêmes items que la BottomNav mobile (source unique), rendus en vertical.
// Actif = bg-white/10 + texte blanc gras ; inactif = teal clair muted.
type Props = {
  items: NavItem[];
  active: string;
  onSelect: (item: NavItem) => void;
  footer?: ReactNode;
};

export default function Sidebar({ items, active, onSelect, footer }: Props) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-primo-ink-900 text-white lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primo-gold text-primo-ink-900">
          <Icon name="star" size={20} />
        </span>
        <span className="text-xl font-extrabold tracking-[-0.5px]">Prim'O</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {items.map((item) => {
          const on = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item)}
              aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                on ? 'bg-white/10 font-bold text-white' : 'font-medium text-[#9FCFCA] hover:bg-white/5'
              }`}
            >
              <Icon name={item.icon} size={20} strokeWidth={on ? 1.95 : 1.8} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {footer && <div className="border-t border-white/10 px-3 py-4">{footer}</div>}
    </aside>
  );
}
