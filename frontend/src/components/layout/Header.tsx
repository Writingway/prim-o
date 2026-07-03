import type { ReactNode } from 'react';

type HeaderProps = {
  title?: string;        // Brand wordmark text.
  children?: ReactNode;  // Action buttons supplied by each page.
};

export default function Header({ title = "Prim'O", children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 hidden flex-wrap items-center justify-between gap-3 bg-primo-teal px-4 py-3.5 shadow-[0_2px_12px_rgba(79,70,229,0.25)] sm:px-8 sm:py-4 lg:flex">
      <span className="text-2xl font-extrabold tracking-[-0.5px] text-white">{title}</span>
      <nav className="flex flex-wrap gap-2.5">{children}</nav>
    </header>
  );
}
