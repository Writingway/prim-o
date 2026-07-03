import { useCallback, useEffect, useRef, useState } from 'react';

const BTN = 'rounded-lg border border-transparent px-[18px] py-2.5 text-sm font-semibold transition cursor-pointer';

// In-house confirmation popup (replaces the native window.confirm / alert).
// Promise-based API: `await confirm({ message })` resolves to true/false, so
// handlers keep the same `if (!await confirm(...)) return;` flow.

export type ConfirmOptions = {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // red confirm button (destructive action)
};

// Signature of the `confirm` function returned by useConfirm. Shared with hooks that
// orchestrate a confirmed action (the dialog itself stays in the component).
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

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

  // Escape cancels while the popup is open.
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts, close]);

  const confirmDialog = opts ? (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(20,22,28,0.45)] p-4 animate-confirm-fade"
      role="presentation"
      onClick={() => close(false)}
    >
      <div
        className="w-full max-w-[420px] rounded-xl bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] animate-confirm-pop"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {opts.title && <h2 className="mb-2 text-lg font-bold text-primo-ink">{opts.title}</h2>}
        <p className="mb-5 text-[15px] leading-relaxed text-primo-gray">{opts.message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            className={`${BTN} border-primo-border bg-white text-primo-gray hover:bg-gray-100`}
            onClick={() => close(false)}
          >
            {opts.cancelLabel ?? 'Annuler'}
          </button>
          <button
            type="button"
            className={`${BTN} text-white ${opts.danger ? 'bg-primo-error hover:brightness-95' : 'bg-primo-teal hover:bg-primo-teal-dark'}`}
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
