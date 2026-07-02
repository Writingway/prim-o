import type { ReactNode } from 'react';

// Console topbar (desktop lg+ only) — title and subtitle on the left, actions on the
// right. ConsoleHeaderMobile is its mobile counterpart.
type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function Topbar({ title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 hidden items-center justify-between gap-4 border-b border-primo-line bg-white px-6 py-4 lg:flex">
      <div className="flex flex-col">
        {title && <span className="text-xl font-extrabold tracking-[-0.5px] text-primo-ink">{title}</span>}
        {subtitle && <span className="text-sm text-primo-muted">{subtitle}</span>}
      </div>
      {actions && <nav className="flex flex-wrap gap-2.5">{actions}</nav>}
    </header>
  );
}
