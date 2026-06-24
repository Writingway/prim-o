// Styles partagés des dashboards (Manager + Owner) et des composants d'allocation.
// Constantes className Tailwind — source unique, remplace l'ancien ManagerDashboard.css.
// Suit l'idiome déjà en place dans le codebase (cf. HEADER_BTN_GHOST, CANCEL_BTN).

/* ── Layout ── */
export const DASH_WRAPPER = 'min-h-screen bg-primo-surface px-4 py-5';
export const DASH_CONTAINER = 'mx-auto max-w-[760px]';

/* ── Chips récap (Owner / Manager) ── */
export const DASH_STAT =
  'rounded-[14px] border border-primo-line bg-white px-3.5 py-2.5 text-sm text-primo-slate';
export const DASH_STAT_STRONG = 'text-primo-ink';

/* ── Bouton invitation (pill pointillé) ── */
export const DASH_INVITE =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed ' +
  'border-primo-mint-line bg-primo-mint px-3.5 py-2.5 text-[13px] font-bold text-primo-teal-strong ' +
  'transition hover:bg-primo-mint-line-hover';

/* ── Messages d'état ── */
export const DASH_MSG = 'py-7 text-center text-primo-muted';
export const DASH_ERROR = 'text-primo-error';
export const DASH_RETRY =
  'ml-2 cursor-pointer rounded-[9px] border-0 bg-primo-teal px-3 py-[5px] font-semibold text-white';

/* ── Onglets ── */
export const DASH_TABS = 'mb-3.5 mt-[18px] flex gap-1.5 border-b-2 border-primo-line';
export const DASH_TAB =
  'mb-[-2px] cursor-pointer border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 ' +
  'text-[15px] font-bold text-primo-muted';
export const DASH_TAB_ACTIVE = 'border-b-primo-teal-strong text-primo-teal-strong';

/* ── Liste lignes-cartes (employés / managers) ── */
export const EMP_LIST = 'm-0 flex list-none flex-col gap-2.5 p-0';
export const EMP_ITEM = 'rounded-[14px] border border-primo-line bg-white px-3.5 py-[13px]';
export const EMP_ROW = 'flex items-center gap-3';
export const EMP_AVATAR =
  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primo-mint ' +
  'text-[13px] font-extrabold text-primo-teal-strong';
export const EMP_MAIN = 'min-w-0 flex-1';
export const EMP_NAME = 'flex items-center gap-2 font-bold text-primo-ink';
export const EMP_SUB = 'overflow-hidden text-ellipsis whitespace-nowrap text-xs text-primo-muted';
export const EMP_BALANCE = 'flex-shrink-0 text-right';
export const EMP_BALANCE_NUM = 'text-lg font-extrabold leading-none text-primo-ink';
export const EMP_BALANCE_LABEL = 'text-[11px] text-primo-muted';

/* ── Badges ── */
export const EMP_BADGE = 'inline-flex items-center gap-1 rounded-[12px] px-2.5 py-0.5 text-[11px] font-bold';
export const EMP_BADGE_VERIFIED = 'bg-primo-success-soft text-primo-success';
export const EMP_BADGE_PENDING = 'bg-primo-warn-soft2 text-primo-warn-strong';

/* ── Boutons / formulaire d'attribution ── */
export const EMP_ATTRIB_BTN =
  'flex-shrink-0 cursor-pointer rounded-[11px] border-[1.5px] border-primo-teal bg-white ' +
  'px-[13px] py-[9px] text-[13px] font-bold text-primo-teal transition hover:bg-primo-mint';
export const EMP_ATTRIB_FORM =
  'mt-3 flex flex-wrap items-center gap-2 border-t border-primo-line pt-3';
export const EMP_ATTRIB_SUBMIT =
  'inline-flex items-center gap-1.5 rounded-[12px] border-0 bg-primo-teal px-[18px] py-[11px] ' +
  'text-sm font-bold text-white shadow-[0_10px_22px_-8px_rgba(0,161,154,0.55)] transition ' +
  'hover:bg-primo-teal-strong disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none';
export const EMP_ATTRIB_ERROR = 'm-0 w-full text-[13px] text-primo-error';
export const EMP_DELETE_BTN =
  'inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-[11px] ' +
  'border-[1.5px] border-primo-error-line bg-white px-2.5 py-[9px] text-primo-error transition ' +
  'hover:bg-primo-error-soft disabled:cursor-not-allowed disabled:opacity-50';

/* ── Historique des transactions ── */
export const HISTORY = 'mt-[26px]';
export const HISTORY_TITLE = 'm-0 mb-3 text-base font-bold text-primo-ink';
export const HISTORY_LIST = 'm-0 flex list-none flex-col gap-2 p-0';
export const HISTORY_ROW =
  'flex items-center gap-3 rounded-[13px] border border-primo-line bg-white px-3.5 py-2.5 text-sm';
export const HISTORY_EMP = 'min-w-[130px] font-bold text-primo-ink';
export const HISTORY_REASON = 'flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-primo-slate';
export const HISTORY_DATE = 'flex-shrink-0 text-xs text-primo-muted';
export const HISTORY_AMOUNT = 'flex-shrink-0 font-extrabold text-primo-success';

/* ── Champs d'allocation (montant, %, motif) ── */
export const ALLOC_INPUT =
  'rounded-[11px] border-[1.5px] border-primo-line bg-white px-3 py-2.5 text-sm text-primo-ink ' +
  'focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] focus:outline-none';

/* ── Sélecteur de mode (onglets segmentés) ── */
export const ALLOC_MODE = 'w-full';
export const ALLOC_MODE_OPTIONS =
  'flex gap-1 rounded-[14px] border border-primo-line bg-primo-surface p-1';
export const ALLOC_MODE_OPT =
  'inline-flex flex-1 cursor-pointer items-center justify-center rounded-[10px] ' +
  'px-2 py-2 text-[13px] font-bold text-primo-slate transition';
export const ALLOC_MODE_OPT_ACTIVE =
  'bg-white text-primo-teal-strong shadow-[0_2px_8px_-3px_rgba(6,59,56,0.25)]';
export const ALLOC_MODE_HINT = 'my-2 text-[13px] text-primo-muted';

/* ── Stepper de pourcentage (−/+) ── */
export const ALLOC_PCT_ROW =
  'mt-2.5 flex items-center justify-between rounded-[14px] border border-primo-line bg-white px-3.5 py-3';
export const ALLOC_PCT_LABEL = 'text-[13px] font-semibold text-primo-slate';
export const ALLOC_PCT_CTRL = 'flex items-center gap-3';
export const ALLOC_PCT_BTN =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] ' +
  'border-primo-teal bg-white text-primo-teal transition hover:bg-primo-mint ' +
  'disabled:cursor-not-allowed disabled:opacity-40';
export const ALLOC_PCT_VALUE =
  'min-w-[58px] text-center text-[26px] font-extrabold leading-none text-primo-ink';

/* ── Carte montant (gros affichage, ink-teal foncé + Coin or) ── */
export const ALLOC_AMOUNT_CARD =
  'flex flex-col items-center gap-2 rounded-2xl bg-[#063B38] px-4 py-5 text-white';
export const ALLOC_AMOUNT_LABEL = 'text-[12px] font-semibold uppercase tracking-wide text-white/60';
export const ALLOC_AMOUNT_VALUE =
  'flex items-center gap-2.5 text-[44px] font-extrabold leading-none tracking-[-0.03em]';

/* ── Chips de montant rapide ── */
export const ALLOC_CHIPS = 'mt-3 grid grid-cols-4 gap-2';
export const ALLOC_CHIP =
  'cursor-pointer rounded-[12px] border-[1.5px] px-2 py-2.5 text-[14px] font-bold transition';
export const ALLOC_CHIP_ON = 'border-primo-teal bg-primo-teal text-white';
export const ALLOC_CHIP_OFF =
  'border-primo-line bg-white text-primo-slate hover:bg-primo-mint';

/* ── Bannière info rétribution (menthe) ── */
export const ALLOC_BANNER =
  'mt-3 flex items-start gap-2 rounded-[14px] bg-primo-mint px-3.5 py-3 text-[13px] ' +
  'font-medium text-primo-teal-strong';

/* ── Grille des enveloppes ── */
export const ENV_GRID = 'mt-2 flex flex-wrap gap-3';
export const ENV_TILE =
  'flex w-[158px] flex-col items-center gap-[5px] rounded-2xl border-[1.5px] border-primo-teal-strong ' +
  'bg-white px-3 py-4 text-center';
export const ENV_TILE_LOCKED = 'border-primo-line opacity-75';
export const ENV_ICON = 'flex h-10 w-10 items-center justify-center rounded-[12px] bg-primo-mint text-primo-teal-strong';
export const ENV_ICON_LOCKED = 'bg-primo-surface text-primo-muted';
export const ENV_AMOUNT = 'text-[22px] font-extrabold text-primo-ink';
export const ENV_MODE = 'text-[13px] text-primo-muted';
export const ENV_PART = 'text-xs text-primo-muted';
export const ENV_STATE_DONE = 'inline-flex items-center gap-1 text-xs font-bold text-primo-success';

/* ── Bloc de redistribution ── */
export const RB = 'mt-4 overflow-hidden rounded-2xl border border-primo-line bg-primo-surface';
export const RB_HEADER = 'flex items-center gap-2 bg-primo-ink-900 px-4 py-[13px] font-bold text-white';
export const RB_STATS = 'flex gap-3 px-4 py-3.5 max-[520px]:flex-col';
export const RB_STAT = 'flex flex-1 flex-col gap-1 rounded-[12px] border border-primo-line bg-white p-3';
export const RB_STAT_LABEL = 'text-xs text-primo-muted';
export const RB_STAT_VALUE = 'text-xl text-primo-ink';
export const RB_STAT_REST = 'border-[1.5px] border-primo-teal-strong';
export const RB_STAT_VALUE_OK = 'text-primo-success';
export const RB_LIST = 'px-4';
export const RB_ROW =
  'flex items-center gap-2.5 rounded-[14px] border border-primo-line bg-white px-3 py-2';
export const RB_NAME = 'flex-1 font-semibold text-primo-ink';
export const RB_ACTIONS = 'flex justify-end gap-2.5 px-4 py-3';
