import type { ReactNode } from 'react';

// Mobile (<lg) console header - counterpart of the desktop Topbar: section title and
// subtitle on the left, an actions slot for icon buttons on the right.
type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function ConsoleHeaderMobile({ title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-primo-line bg-white px-4 py-3 sm:px-5 lg:hidden">
      <div className="flex min-w-0 flex-col">
        {title && (
          <span className="truncate text-[17px] font-extrabold tracking-[-0.3px] text-primo-ink">
            {title}
          </span>
        )}
        {subtitle && (
          <span className="truncate text-[12px] text-primo-muted">{subtitle}</span>
        )}
      </div>
      {actions && <nav className="flex flex-none items-center gap-2">{actions}</nav>}
    </header>
  );
}
