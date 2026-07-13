// Tailwind classes shared by every auth surface (AuthPage, AuthTabs, Login/Register,
// ResetPassword, Onboarding). "Reimagined" v1.1 design charter (teal + gold, Poppins).
// Single source of truth: one place to touch for the look of the auth screens.

export const WRAPPER = 'flex min-h-screen items-center justify-center bg-primo-surface p-5';
export const CARD =
  'w-full max-w-[400px] rounded-3xl bg-white px-7 py-9 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)]';
export const BACK =
  'mb-3 inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-sm font-semibold text-primo-slate-soft transition hover:text-primo-teal-strong';

// Segmented tabs (the active tab is a teal pill).
export const TABS = 'mb-5 flex gap-1 rounded-[14px] bg-[#e8efed] p-1';
export const tab = (active: boolean) =>
  `flex-1 cursor-pointer rounded-[11px] border-0 py-2.5 text-sm transition ${
    active
      ? 'bg-primo-teal font-bold text-white shadow-[0_4px_10px_-3px_rgba(0,161,154,0.5)]'
      : 'bg-transparent font-semibold text-primo-slate-soft'
  }`;

export const FORM = 'flex flex-col gap-3';
export const INPUT =
  'rounded-[13px] border-[1.5px] border-primo-line bg-white px-3.5 py-3 text-[15px] text-primo-ink placeholder:text-primo-muted transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] focus:outline-none';
export const SUBMIT =
  'mt-1 cursor-pointer rounded-[14px] border-0 bg-primo-teal py-3.5 p-6 text-base font-bold text-white shadow-[0_12px_26px_-8px_rgba(0,161,154,0.6)] transition hover:bg-primo-teal-strong disabled:cursor-not-allowed disabled:opacity-60';

export const ERROR = 'm-0 text-sm text-primo-error';
export const SUCCESS =
  'm-0 mb-1 rounded-xl bg-primo-success-soft px-3.5 py-2.5 text-center text-sm font-medium text-primo-success';
export const HELP = 'm-0 text-sm text-primo-slate-soft';
// Understated link-style button (forgot password, back links…).
export const LINK =
  'cursor-pointer self-start border-none bg-transparent p-0 text-sm font-semibold text-primo-teal-strong hover:underline';

export const CONSENT = 'flex items-start gap-2 text-left text-[13px] text-primo-slate';
export const CONSENT_BOX = 'mt-0.5 w-auto shrink-0 accent-primo-teal';
export const CONSENT_LINK = 'font-semibold text-primo-teal-strong';
