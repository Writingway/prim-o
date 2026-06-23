import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import type { NavItem } from '@/hooks/useBottomNav';

// Description de navigation partagée : alimente la Sidebar (lg+) ET la BottomNav
// (mobile) à partir du même objet — source unique, pas de duplication.
type LayoutNav = {
  items: NavItem[];
  active: string;
  onSelect: (item: NavItem) => void;
};

type LayoutProps = {
  title?: string;
  headerActions?: ReactNode; // transmis au Header
  children: ReactNode;       // le contenu de la page
  // 'public' (défaut) = pages vitrine/légales → footer affiché.
  // 'app' = coquille appli mobile connectée → pas de footer, barre d'onglets
  //         en bas (zone du pouce). Voir moodboard client.
  // 'console' = coquille adaptative : sidebar + topbar en desktop (lg+),
  //             Header + BottomNav en mobile. Un seul arbre de contenu.
  chrome?: 'app' | 'public' | 'console';
  bottomNav?: ReactNode;     // rendu fixe en bas si chrome='app'
  // Champs console (ignorés par 'app'/'public').
  nav?: LayoutNav;
  subtitle?: string;
  sidebarFooter?: ReactNode;
};

export default function Layout({
  title,
  headerActions,
  children,
  chrome = 'public',
  bottomNav,
  nav,
  subtitle,
  sidebarFooter,
}: LayoutProps) {
  if (chrome === 'console') {
    return (
      <div className="min-h-[100dvh] lg:flex">
        {/* Desktop (lg+) : sidebar verticale à gauche. */}
        {nav && (
          <Sidebar items={nav.items} active={nav.active} onSelect={nav.onSelect} footer={sidebarFooter} />
        )}
        <div className="flex min-h-[100dvh] flex-1 flex-col">
          {/* Mobile (<lg) : Header classique ; masqué en desktop. */}
          <div className="lg:hidden">
            <Header title={title}>{headerActions}</Header>
          </div>
          {/* Desktop (lg+) : topbar ; masquée en mobile. */}
          <Topbar title={title} subtitle={subtitle} actions={headerActions} />
          <main className="w-full flex-1 pb-24 lg:overflow-y-auto lg:pb-0">{children}</main>
          {/* Mobile (<lg) : BottomNav depuis le MÊME objet nav que la Sidebar. */}
          {nav && bottomNav}
        </div>
      </div>
    );
  }
  if (chrome === 'app') {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Header title={title}>{headerActions}</Header>
        {/* pb pour ne pas masquer le bas du contenu sous la barre d'onglets. */}
        <main className="w-full flex-1 pb-24 lg:pb-0">{children}</main>
        {bottomNav}
      </div>
    );
  }
  // Public : footer (vitrine/légal). Si une bottomNav est fournie (ex. landing),
  // elle s'affiche en MOBILE uniquement (lg:hidden) et le footer passe en desktop.
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header title={title}>{headerActions}</Header>
      <main className={`w-full flex-1 ${bottomNav ? 'pb-24 lg:pb-0' : ''}`}>{children}</main>
      {bottomNav ? (
        <>
          <div className="lg:hidden">{bottomNav}</div>
          <div className="hidden lg:block"><Footer /></div>
        </>
      ) : (
        <Footer />
      )}
    </div>
  );
}
