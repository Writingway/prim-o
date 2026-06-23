import { useEffect, useState } from 'react';

// Vrai au-delà du breakpoint `lg` Tailwind (1024px). Lu en synchrone à l'init
// (SPA, window dispo) → pas de flash au premier rendu. Suit le resize.
const QUERY = '(min-width: 1024px)';

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const sync = () => setIsDesktop(mql.matches);
    sync(); // resynchronise au montage (cas où la largeur a changé avant l'effet)
    mql.addEventListener('change', sync);
    // Filet : l'émulation DevTools (toggle device toolbar) ne déclenche pas
    // toujours l'event matchMedia, mais déclenche bien window.resize.
    window.addEventListener('resize', sync);
    return () => {
      mql.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  return isDesktop;
}
