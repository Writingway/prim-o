// Boutons de la barre header (anciens .app-btn* de layout.css), partagés par
// toutes les pages qui passent des actions au Header via `headerActions`.
// Source unique → permet de supprimer le reliquat layout.css.

const HEADER_BTN =
  'cursor-pointer rounded-lg border border-transparent px-[18px] py-2.5 text-sm font-semibold transition';

// Sur fond teal : bouton plein blanc (action principale).
export const HEADER_BTN_PRIMARY = `${HEADER_BTN} bg-white text-primo-teal hover:bg-primo-teal-soft`;
// Sur fond teal : bouton fantôme (contour blanc translucide).
export const HEADER_BTN_GHOST = `${HEADER_BTN} border-white/60 bg-transparent text-white hover:bg-white/[0.12]`;

// Header console MOBILE (fond blanc) : bouton icône carré, lisible sur clair.
export const HEADER_BTN_ICON =
  'flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-primo-gray transition hover:bg-primo-surface hover:text-primo-ink';
export const HEADER_BTN_ICON_DANGER =
  'flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-primo-gray transition hover:bg-primo-error-soft hover:text-primo-error';
