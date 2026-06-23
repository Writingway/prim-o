import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

type LayoutProps = {
  title?: string;
  headerActions?: ReactNode; // transmis au Header
  children: ReactNode;       // le contenu de la page
  // 'public' (défaut) = pages vitrine/légales → footer affiché.
  // 'app' = coquille appli mobile connectée → pas de footer, barre d'onglets
  //         en bas (zone du pouce). Voir moodboard client.
  chrome?: 'app' | 'public';
  bottomNav?: ReactNode;     // rendu fixe en bas si chrome='app'
};

export default function Layout({
  title,
  headerActions,
  children,
  chrome = 'public',
  bottomNav,
}: LayoutProps) {
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
