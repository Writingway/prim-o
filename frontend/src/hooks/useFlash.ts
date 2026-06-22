import { useState } from 'react';

// Message de confirmation transitoire (remplace les alert() natifs).
// Réutilisable : tout écran qui veut un toast léger « action OK ».
export function useFlash(durationMs = 3000) {
  const [notice, setNotice] = useState('');

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), durationMs);
  };

  return { notice, flash };
}
