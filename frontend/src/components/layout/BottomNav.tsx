import { useState } from 'react';

// Barre d'onglets bas (mobile-first), façon appli native — zone du pouce.
// Remplace le footer légal dans la coquille connectée (moodboard client).
// Navigation par ancres in-page : colle au /dashboard monolithique existant,
// aucune route inventée, aucun appel backend. Les liens légaux migrent dans
// l'onglet Profil (RGPD préservé).

export type NavItem = {
  key: string;
  label: string;
  icon: string;       // emoji : pas de lib d'icônes ajoutée (zéro dette)
  targetId: string;   // id de la section à atteindre
};

type Props = {
  items: NavItem[];
};

export default function BottomNav({ items }: Props) {
  const [active, setActive] = useState(items[0]?.key ?? '');

  const go = (item: NavItem) => {
    setActive(item.key);
    document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-primo-border bg-white/95 backdrop-blur"
      // Encoche / barre gestuelle iOS-Android.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const on = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => go(item)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
              on ? 'text-primo-teal' : 'text-primo-gray'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
