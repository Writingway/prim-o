import type { IconName } from '@/components/ui/Icon';

// Config de navigation bas, partagée par tous les espaces connectés
// (employé/manager/owner) — source unique, alimente BottomNav et Sidebar. Chaque
// espace gère l'onglet actif via un state `tab` (modèle onglets-vues).
export type NavItem = { key: string; label: string; icon: IconName; targetId: string };
export type NavContext = 'employee' | 'manager' | 'owner';

export const NAV_ITEMS: Record<NavContext, NavItem[]> = {
  employee: [
    { key: 'accueil', label: 'Accueil', icon: 'home', targetId: 'nav-accueil' },
    { key: 'historique', label: 'Historique', icon: 'clock', targetId: 'nav-historique' },
    { key: 'profil', label: 'Profil', icon: 'user', targetId: 'nav-profil' },
  ],
  manager: [
    { key: 'accueil', label: 'Accueil', icon: 'home', targetId: 'nav-accueil' },
    { key: 'enveloppes', label: 'Enveloppes', icon: 'envelope', targetId: 'nav-enveloppes' },
    { key: 'offres', label: 'Offres', icon: 'gift', targetId: 'nav-offres' },
    { key: 'employes', label: 'Employés', icon: 'users', targetId: 'nav-employes' },
    { key: 'profil', label: 'Profil', icon: 'user', targetId: 'nav-profil' },
  ],
  owner: [
    { key: 'accueil', label: 'Accueil', icon: 'home', targetId: 'nav-accueil' },
    { key: 'managers', label: 'Managers', icon: 'users', targetId: 'nav-managers' },
    { key: 'envoyees', label: 'Enveloppes', icon: 'envelope', targetId: 'nav-envoyees' },
    { key: 'employes', label: 'Employés', icon: 'user', targetId: 'nav-employes' },
    { key: 'profil', label: 'Profil', icon: 'settings', targetId: 'nav-profil' },
  ],
};
