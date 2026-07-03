import type { IconName } from '@/components/ui/Icon';

// Bottom-navigation config shared by every signed-in space (employee/manager/owner) - single
// source of truth feeding both BottomNav and Sidebar. Each space tracks the active tab through a
// `tab` state (tabs-as-views model).
export type NavItem = { key: string; label: string; icon: IconName; targetId: string };
export type NavContext = 'employee' | 'manager' | 'owner';

export const NAV_ITEMS: Record<NavContext, NavItem[]> = {
  employee: [
    { key: 'historique', label: 'Accueil', icon: 'home', targetId: 'nav-historique' },
    { key: 'offres', label: 'Offres', icon: 'gift', targetId: 'nav-offres' },
    { key: 'codes', label: 'Mes codes', icon: 'ticket', targetId: 'nav-codes' },
    { key: 'profil', label: 'Profil', icon: 'user', targetId: 'nav-profil' },
  ],
  manager: [
    { key: 'employes', label: 'Mon équipe', icon: 'users', targetId: 'nav-employes' },
    { key: 'enveloppes', label: 'Enveloppes', icon: 'envelope', targetId: 'nav-enveloppes' },
    { key: 'offres', label: 'Offres', icon: 'gift', targetId: 'nav-offres' },
    { key: 'codes', label: 'Mes codes', icon: 'ticket', targetId: 'nav-codes' },
    { key: 'profil', label: 'Profil', icon: 'user', targetId: 'nav-profil' },
  ],
  owner: [
    { key: 'accueil', label: 'Pool', icon: 'building', targetId: 'nav-accueil' },
    { key: 'managers', label: 'Allouer', icon: 'send', targetId: 'nav-managers' },
    { key: 'stats', label: 'Stats', icon: 'chart', targetId: 'nav-stats' },
    { key: 'profil', label: 'Profil', icon: 'settings', targetId: 'nav-profil' },
  ],
};
