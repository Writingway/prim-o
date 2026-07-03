import { useEffect, useState } from 'react';

// True above Tailwind's `lg` breakpoint (1024px). Read synchronously at init (SPA, window is
// available) so the first render doesn't flash; tracks resizes afterwards.
const QUERY = '(min-width: 1024px)';

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const sync = () => setIsDesktop(mql.matches);
    sync(); // resync on mount, in case the width changed before the effect ran
    mql.addEventListener('change', sync);
    // Safety net: DevTools device emulation (toggle device toolbar) does not always fire the
    // matchMedia change event, but it does fire window.resize.
    window.addEventListener('resize', sync);
    return () => {
      mql.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  return isDesktop;
}
