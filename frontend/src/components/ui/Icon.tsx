import type { ReactNode, SVGProps } from 'react';

// Jeu d'icônes linéaires Prim'O (trait 1.8, viewBox 0 0 24 24) — zéro emoji.
// Tracés repris de la maquette. `star` est plein (logo « pièce »), le reste au trait.
export type IconName =
  | 'home' | 'gift' | 'received' | 'user' | 'users' | 'bell' | 'search'
  | 'flame' | 'trophy' | 'shield' | 'mail' | 'lock' | 'phone' | 'check'
  | 'plus' | 'minus' | 'send' | 'building' | 'card' | 'envelope' | 'chart'
  | 'alert' | 'info' | 'copy' | 'logout' | 'settings' | 'clock' | 'star'
  | 'coffee' | 'ticket' | 'heart' | 'plane' | 'trash'
  | 'chevron-right' | 'chevron-down' | 'arrow-left' | 'arrow-up';

const STROKE: Partial<Record<IconName, ReactNode>> = {
  home: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10.5V19h12v-8.5" /></>,
  gift: <><path d="M6 8h12l-1 11H7L6 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  received: <><rect x="4" y="9" width="16" height="11" rx="1.6" /><path d="M4 13h16M12 9v11" /></>,
  user: <><circle cx="12" cy="8.5" r="3.3" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></>,
  users: <><circle cx="9" cy="9" r="3" /><path d="M3.5 18a5.5 5.5 0 0 1 11 0" /><path d="M16 6.6a3 3 0 0 1 0 5.7M17.5 18a5.5 5.5 0 0 0-2-4.2" /></>,
  bell: <><path d="M6 17V11a6 6 0 0 1 12 0v6" /><path d="M4.5 17h15" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4" /></>,
  flame: <path d="M12 3c1 3.5 5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3 1.6-4 .7 1 1.9 1.2 2.4.5.6-.8-1-2.6-.4-5.5Z" />,
  trophy: <><path d="M7 5h10v3a5 5 0 0 1-10 0V5Z" /><path d="M7 6H4.6v1.4A3 3 0 0 0 7 10M17 6h2.4v1.4A3 3 0 0 1 17 10" /><path d="M12 13v3M9 20h6M10.2 20l.4-4M13.8 20l-.4-4" /></>,
  shield: <path d="M12 4l7 2.5v5c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5v-5L12 4Z" />,
  mail: <><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />,
  building: <path d="M9 12h6m-6 4h6m-3-12 8 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8l8-4Z" />,
  card: <><rect x="3.5" y="6" width="17" height="12" rx="2.5" /><path d="M3.5 10h17" /></>,
  envelope: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7.5 8.5 6 8.5-6" /></>,
  chart: <path d="M4 20h16M6 20V12M11 20V6M16 20v-5" />,
  alert: <path d="M12 9v4M12 17h.01M10.3 4.3 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 15.5V6a1.5 1.5 0 0 1 1.5-1.5H15" /></>,
  logout: <><path d="M14 4h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" /><path d="M17 8l4 4-4 4M21 12H9" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  coffee: <path d="M6 4v4a2 2 0 0 0 4 0V4M8 8v12M16 4c-1.2 1.5-1.5 4-1.5 6.5 0 1.5.7 2.5 1.5 2.5v7" />,
  ticket: <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />,
  heart: <path d="M12 20s-6-4-6-9a4 4 0 0 1 7-2.6A4 4 0 0 1 20 11c0 5-8 9-8 9Z" />,
  trash: <><path d="M5 7h14M9 7V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 11.5a1.5 1.5 0 0 1-1.5 1.4H8.2a1.5 1.5 0 0 1-1.5-1.4L6 7" /><path d="M10 11v5M14 11v5" /></>,
  plane: <path d="M11 4.5c.6 0 1 .9 1 2v4l7 4v2l-7-2v3l2 1.5v1.5l-3-1-3 1v-1.5L10 17v-3l-7 2v-2l7-4V6.5c0-1.1.4-2 1-2Z" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'arrow-left': <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  'arrow-up': <path d="M12 19V5M5 12l7-7 7 7" />,
};

// Étoile pleine = logo « pièce » (jeton / récompense).
const STAR = <path d="M12 3.2l2.4 5.2 5.7.6-4.2 3.9 1.1 5.6L12 16l-5 2.5 1.1-5.6L3.9 9l5.7-.6L12 3.2Z" />;

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }: Props) {
  if (name === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
        {STAR}
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {STROKE[name]}
    </svg>
  );
}
