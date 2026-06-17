import { useCallback, useEffect, useRef, useState } from 'react';
import './ConfirmDialog.css';

// Popup de confirmation maison (remplace window.confirm / alert natifs).
// API promise-based : `await confirm({ message })` rend true/false, donc les
// handlers gardent le même flux `if (!await confirm(...)) return;`.

type ConfirmOptions = {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // bouton de confirmation rouge (action destructive)
};

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  }, []);

  // Echap = annuler tant que le popup est ouvert.
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts, close]);

  const confirmDialog = opts ? (
    <div className="confirm-overlay" role="presentation" onClick={() => close(false)}>
      <div
        className="confirm-box"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {opts.title && <h2 className="confirm-title">{opts.title}</h2>}
        <p className="confirm-message">{opts.message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-btn confirm-btn-cancel" onClick={() => close(false)}>
            {opts.cancelLabel ?? 'Annuler'}
          </button>
          <button
            type="button"
            className={`confirm-btn ${opts.danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
            onClick={() => close(true)}
            autoFocus
          >
            {opts.confirmLabel ?? 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, confirmDialog };
}
