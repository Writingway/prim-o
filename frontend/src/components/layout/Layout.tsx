import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import type { NavSection } from './Sidebar';
import Topbar from './Topbar';
import ConsoleHeaderMobile from './ConsoleHeaderMobile';
import type { NavItem } from '@/hooks/useBottomNav';

type LayoutNav = {
  items: NavItem[];
  sections?: NavSection[];
  active: string;
  onSelect: (item: NavItem) => void;
};

type LayoutProps = {
  title?: string;
  headerActions?: ReactNode; // transmis au Topbar desktop
  headerActionsMobile?: ReactNode; // boutons icônes du header console mobile
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
  headerActionsMobile,
  children,
  chrome = 'public',
  bottomNav,
  nav,
  subtitle,
  sidebarFooter,
}: LayoutProps) {
  if (chrome === 'console') {
    return (
      <div className="flex h-[100dvh] overflow-hidden lg:flex">
        {/* Desktop (lg+) : sidebar verticale à gauche. */}
        {nav && (
          <Sidebar
            items={nav.items}
            sections={nav.sections}
            active={nav.active}
            onSelect={nav.onSelect}
            footer={sidebarFooter}
            subtitle={subtitle}
          />
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Mobile (<lg) : header console (pendant du Topbar) — titre + sous-titre + actions. */}
          <ConsoleHeaderMobile title={title} subtitle={subtitle} actions={headerActionsMobile} />
          {/* Desktop (lg+) : topbar ; masquée en mobile. */}
          <Topbar title={title} subtitle={subtitle} actions={headerActions} />
          <main className="w-full flex-1 overflow-y-auto pb-24 lg:pb-0">{children}</main>
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
