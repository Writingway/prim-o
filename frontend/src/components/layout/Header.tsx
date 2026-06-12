import type { ReactNode } from 'react';

type HeaderProps = {
  title?: string;        // texte de la marque, défaut Prim'O
  children?: ReactNode;  // les boutons, fournis par chaque page
};

export default function Header({ title = "Prim'O", children }: HeaderProps) {
  return (
    <header className="app-header">
      <span className="app-header-brand">{title}</span>
      <nav className="app-header-actions">{children}</nav>
    </header>
  );
}
