import { toast } from 'sonner';

// Transient confirmation message (replaces native alert()).
// Now delegates to the global toast system (sonner): out-of-flow rendering, a11y (aria-live) and
// stacking are handled in one place. `notice` is still exposed (always '') for backward
// compatibility — leftover `{notice && <p>}` render nothing and can be removed screen by screen.
export function useFlash(durationMs = 3000) {
  const flash = (msg: string) => {
    toast.success(msg, { duration: durationMs });
  };

  return { notice: '', flash };
}
