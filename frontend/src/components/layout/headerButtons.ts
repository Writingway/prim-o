// Shared header-bar button styles for every page that passes actions to the Header
// via `headerActions`.

const HEADER_BTN =
  'cursor-pointer rounded-lg border border-transparent px-[18px] py-2.5 text-sm font-semibold transition';

// On a teal background: solid white button (primary action).
export const HEADER_BTN_PRIMARY = `${HEADER_BTN} bg-white text-primo-teal hover:bg-primo-teal-soft`;
// On a teal background: ghost button (translucent white outline).
export const HEADER_BTN_GHOST = `${HEADER_BTN} border-white/60 bg-transparent text-white hover:bg-white/[0.12]`;

// Mobile console header (white background): square icon button, legible on light surfaces.
export const HEADER_BTN_ICON =
  'flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-primo-gray transition hover:bg-primo-surface hover:text-primo-ink';
export const HEADER_BTN_ICON_DANGER =
  'flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-primo-gray transition hover:bg-primo-error-soft hover:text-primo-error';
