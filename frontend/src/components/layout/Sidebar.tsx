import type { ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import type { NavItem } from '@/hooks/useBottomNav';
import logo3 from '@/assets/logos/logo_3.png';

export type NavSection = { label?: string; items: NavItem[] };

type Props = {
  items?: NavItem[];
  sections?: NavSection[];
  active: string;
  onSelect: (item: NavItem) => void;
  footer?: ReactNode;
  subtitle?: string;
};

function NavBtn({ item, active, onSelect }: { item: NavItem; active: string; onSelect: (item: NavItem) => void }) {
  const on = active === item.key;
  return (
    <button
      key={item.key}
      type="button"
      onClick={() => onSelect(item)}
      aria-current={on ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-[9px] px-3 py-[11px] text-[13.5px] transition ${
        on ? 'bg-primo-teal font-bold text-white' : 'font-medium text-[#6BA8A2] hover:bg-white/5'
      }`}
    >
      <Icon name={item.icon} size={17} strokeWidth={on ? 1.95 : 1.8} />
      {item.label}
    </button>
  );
}

export default function Sidebar({ items, sections, active, onSelect, footer, subtitle }: Props) {
  const resolved: NavSection[] = sections ?? (items ? [{ items }] : []);

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col bg-[#0B2B28] text-white lg:flex">
      <div className="flex flex-col items-center gap-1.5 px-5 pb-7 pt-6">
        <img src={logo3} alt="Prim'O" className="w-[110px] object-contain" />
        {subtitle && (
          <div className="text-[10px] font-semibold uppercase tracking-[.06em] text-[#3D7A74]">
            {subtitle}
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-5 px-[14px] pb-4">
        {resolved.map((section, i) => (
          <div key={i}>
            {section.label && (
              <div className="mb-2 px-[10px] text-[10px] font-bold uppercase tracking-[.12em] text-[#2E6660]">
                {section.label}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavBtn key={item.key} item={item} active={active} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {footer && <div className="border-t border-white/[.07] px-[14px] py-5">{footer}</div>}
    </aside>
  );
}
