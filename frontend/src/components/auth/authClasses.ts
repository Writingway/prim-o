// Classes Tailwind partagées par toutes les surfaces d'auth (AuthPage, AuthTabs,
// Login/Register, ResetPassword, Onboarding). Remplacent l'ancien AuthPage.css
// (sélecteurs descendants .auth-form input / .auth-tabs button inclus).
// Source unique : un seul endroit à toucher pour le look des écrans d'auth.

export const WRAPPER = 'flex min-h-screen items-center justify-center bg-[#f4f5f7] p-5';
export const CARD = 'w-full max-w-[380px] rounded-xl bg-white px-7 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]';
export const BACK = 'mb-2 cursor-pointer border-none bg-transparent p-0 text-sm text-primo-gray hover:text-primo-teal';
export const LOGO = 'mb-6 text-center text-[32px] font-bold tracking-[-0.5px] text-[#1f2937]';

export const TABS = 'mb-5 flex border-b border-[#e5e7eb]';
// Onglet : base + état actif (soulignement teal). Usage : `tab(active)`.
export const tab = (active: boolean) =>
  `flex-1 cursor-pointer border-none border-b-2 bg-transparent py-3 text-[15px] transition ${
    active ? 'border-primo-teal font-semibold text-primo-teal' : 'border-transparent text-primo-gray'
  }`;

export const FORM = 'flex flex-col gap-3';
export const INPUT =
  'rounded-lg border border-[#d1d5db] px-3.5 py-3 text-[15px] focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] focus:outline-none';
export const SUBMIT =
  'mt-1 cursor-pointer rounded-lg border-none bg-primo-teal py-3 text-[15px] font-semibold text-white transition hover:bg-primo-teal-dark disabled:cursor-not-allowed disabled:opacity-60';

export const ERROR = 'm-0 text-sm text-primo-error';
export const SUCCESS =
  'm-0 mb-4 rounded-lg bg-[#ecfdf5] px-3 py-2.5 text-center text-sm text-primo-success';
export const HELP = 'm-0 text-sm text-primo-gray';
// Bouton-lien discret (mot de passe oublié, retour…).
export const LINK = 'cursor-pointer border-none bg-transparent p-0 text-sm text-primo-teal hover:underline';

export const CONSENT = 'flex items-start gap-2 text-left text-[13px] text-[#4b5563]';
export const CONSENT_BOX = 'mt-0.5 w-auto shrink-0';
export const CONSENT_LINK = 'text-primo-teal';
