import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import { HERO_THEMES, type HeroTheme } from '@/hooks/useHeroTheme';

// Small button in the hero corner that opens a swatch palette to change the hero color.
// The hero has `overflow-hidden` (it clips the halos), so the palette is rendered in a
// portal on document.body with fixed positioning to avoid being clipped too.
type Props = {
  theme: HeroTheme;
  onChange: (t: HeroTheme) => void;
};

export default function HeroThemeButton({ theme, onChange }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const toggle = () => {
    if (pos) {
      setPos(null);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  };

  return (
    <div className="flex-none">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Changer la couleur du hero"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/15 transition hover:bg-white/20"
      >
        <Icon name="settings" size={18} />
      </button>

      {pos &&
        createPortal(
          <>
            {/* Full-screen backdrop: clicking outside closes the palette. */}
            <div className="fixed inset-0 z-[60]" onClick={() => setPos(null)} />
            <div
              style={{ top: pos.top, right: pos.right }}
              className="fixed z-[61] grid grid-cols-4 gap-2.5 rounded-2xl bg-white p-3 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]"
            >
              {HERO_THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    onChange(t.key);
                    setPos(null);
                  }}
                  aria-label={t.label}
                  title={t.label}
                  style={{ background: t.swatch }}
                  className={`h-7 w-7 rounded-full transition ${
                    theme === t.key ? 'ring-2 ring-primo-ink ring-offset-2' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
