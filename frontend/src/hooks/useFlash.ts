import { toast } from 'sonner';

// Message de confirmation transitoire (remplace les alert() natifs).
// Délègue désormais au système de toast global (sonner) : affichage hors flux,
// a11y (aria-live) et empilement gérés au même endroit. `notice` reste exposé
// (toujours '') pour compat ascendante — les `{notice && <p>}` résiduels ne
// rendent plus rien et peuvent être retirés écran par écran.
export function useFlash(durationMs = 3000) {
  const flash = (msg: string) => {
    toast.success(msg, { duration: durationMs });
  };

  return { notice: '', flash };
}
