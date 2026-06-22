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
        <main className="w-full flex-1 pb-24">{children}</main>
        {bottomNav}
      </div>
    );
  }
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header title={title}>{headerActions}</Header>
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
}
