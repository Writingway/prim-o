import { useState } from 'react';

// Couleur du hero, personnalisable par l'utilisateur (persistée en localStorage).
// Variantes choisies pour rester dans l'identité Prim'O (teal + or) : des dégradés
// profonds et sobres qui s'accordent au logo et à la pièce dorée.
export type HeroTheme =
  | 'teal'
  | 'emeraude'
  | 'ocean'
  | 'bronze'
  | 'prune'
  | 'ardoise'
  | 'indigo'
  | 'bordeaux';

// Les classes de dégradé sont des littéraux complets → Tailwind les détecte.
export const HERO_THEMES: { key: HeroTheme; label: string; gradient: string; swatch: string }[] = [
  { key: 'teal', label: 'Teal', gradient: 'from-primo-hero-from via-primo-ink-900 to-primo-ink-950', swatch: '#0a4b46' },
  { key: 'emeraude', label: 'Émeraude', gradient: 'from-[#0c6b46] via-[#084d33] to-[#05311f]', swatch: '#0c6b46' },
  { key: 'ocean', label: 'Océan', gradient: 'from-[#0a4f7a] via-[#073a5a] to-[#04243a]', swatch: '#0a4f7a' },
  { key: 'bronze', label: 'Bronze', gradient: 'from-[#8a5a1e] via-[#5e3a12] to-[#3a230b]', swatch: '#8a5a1e' },
  { key: 'prune', label: 'Prune', gradient: 'from-[#5a2d72] via-[#3d1f50] to-[#271334]', swatch: '#5a2d72' },
  { key: 'ardoise', label: 'Ardoise', gradient: 'from-[#3b4a54] via-[#2a363d] to-[#1b2329]', swatch: '#3b4a54' },
  { key: 'indigo', label: 'Indigo', gradient: 'from-[#3a3a8f] via-[#292a66] to-[#1a1b42]', swatch: '#3a3a8f' },
  { key: 'bordeaux', label: 'Bordeaux', gradient: 'from-[#7a2733] via-[#561a24] to-[#371016]', swatch: '#7a2733' },
];

const KEY = 'primo-hero-theme';

export function useHeroTheme() {
  const [theme, setThemeState] = useState<HeroTheme>(() => {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return HERO_THEMES.some((t) => t.key === v) ? (v as HeroTheme) : 'teal';
  });

  const setTheme = (t: HeroTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // localStorage indisponible (mode privé strict) → on garde le choix en mémoire.
    }
  };

  const gradient = HERO_THEMES.find((t) => t.key === theme)?.gradient ?? HERO_THEMES[0].gradient;
  return { theme, setTheme, gradient };
}
