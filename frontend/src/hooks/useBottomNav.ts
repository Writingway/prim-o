import { useEffect, useState } from 'react';
import type { IconName } from '@/components/ui/Icon';

// Navigation bas, partagée par tous les espaces connectés (employé/manager/owner).
// La config vit ici (une seule source), pas dupliquée dans chaque écran. Le hook
// gère aussi l'onglet actif via un scroll-spy (l'onglet suit la section visible).
export type NavItem = { key: string; label: string; icon: IconName; targetId: string };
export type NavContext = 'employee' | 'manager' | 'owner';

export const NAV_ITEMS: Record<NavContext, NavItem[]> = {
  employee: [
    { key: 'solde', label: 'Solde', icon: 'home', targetId: 'nav-solde' },
    { key: 'recus', label: 'Reçus', icon: 'received', targetId: 'nav-recus' },
    { key: 'depenses', label: 'Dépenses', icon: 'card', targetId: 'nav-depenses' },
    { key: 'profil', label: 'Profil', icon: 'user', targetId: 'nav-profil' },
  ],
  manager: [
    { key: 'enveloppes', label: 'Enveloppes', icon: 'envelope', targetId: 'nav-enveloppes' },
    { key: 'employes', label: 'Employés', icon: 'users', targetId: 'nav-employes' },
    { key: 'profil', label: 'Profil', icon: 'user', targetId: 'nav-profil' },
  ],
  owner: [
    { key: 'managers', label: 'Managers', icon: 'users', targetId: 'nav-managers' },
    { key: 'envoyees', label: 'Enveloppes', icon: 'envelope', targetId: 'nav-envoyees' },
    { key: 'employes', label: 'Employés', icon: 'user', targetId: 'nav-employes' },
    { key: 'profil', label: 'Profil', icon: 'settings', targetId: 'nav-profil' },
  ],
};

/**
 * @param context  espace concerné (détermine les onglets)
 * @param ready    relance le scroll-spy quand le contenu est monté (post-chargement)
 */
export function useBottomNav(context: NavContext, ready: boolean = true) {
  const items = NAV_ITEMS[context];
  const [active, setActive] = useState(items[0]?.key ?? '');

  const select = (item: NavItem) => {
    setActive(item.key);
    document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!ready) return;
    const byId = new Map(items.map((it) => [it.targetId, it.key]));
    const els = items
      .map((it) => document.getElementById(it.targetId))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const key = top && byId.get(top.target.id);
        if (key) setActive(key);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [context, ready, items]);

  return { items, active, select };
}
