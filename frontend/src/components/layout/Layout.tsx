import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import './layout.css';

type LayoutProps = {
  title?: string;
  headerActions?: ReactNode; // transmis au Header
  children: ReactNode;       // le contenu de la page
};

export default function Layout({ title, headerActions, children }: LayoutProps) {
  return (
    <div className="app-layout">
      <Header title={title}>{headerActions}</Header>
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}
