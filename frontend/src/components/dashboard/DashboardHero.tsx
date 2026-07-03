import type { ReactNode } from 'react';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import HeroLogo from '@/components/dashboard/HeroLogo';
import HeroThemeButton from '@/components/dashboard/HeroThemeButton';
import { useHeroTheme } from '@/hooks/useHeroTheme';

// Hero shell shared by the three dashboards (employee/manager/owner): full-bleed
// gradient (color from useHeroTheme), centered logo, then avatar + title + theme button
// row. Space-specific content (balance card / envelope / pool) is passed as `children`.
type Props = {
  eyebrow: string;          // Overline text (« Bonjour », « Espace manager »…).
  title: ReactNode;         // Name / company (ReactNode so a badge can be included).
  photo?: string | null;    // Profile photo.
  initials: string;         // Fallback when there is no photo.
  halos?: boolean;          // Glow halos (employee home).
  bleed?: string;           // Negative margins matching the parent wrapper's padding.
  children?: ReactNode;     // Hero body, rendered below the title row.
};

export default function DashboardHero({
  eyebrow,
  title,
  photo,
  initials,
  halos = false,
  bleed = '-mx-4 sm:-mx-5',
  children,
}: Props) {
  const { theme, setTheme, gradient } = useHeroTheme();

  return (
    <div
      className={`relative ${bleed} -mt-5 mb-5 overflow-hidden bg-gradient-to-br ${gradient} px-5 pb-6 pt-7 text-white`}
    >
      {halos && (
        <>
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primo-teal/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primo-gold/10 blur-3xl" />
        </>
      )}

      <HeroLogo className="relative mb-5" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProfileAvatar photo={photo} initials={initials} size={60} className="ring-1 ring-white/15" />
          <div>
            <div className="text-[12px] uppercase tracking-[0.12em] text-white/55">{eyebrow}</div>
            <div className="text-[17px] font-bold leading-tight">{title}</div>
          </div>
        </div>
        <HeroThemeButton theme={theme} onChange={setTheme} />
      </div>

      {children}
    </div>
  );
}
