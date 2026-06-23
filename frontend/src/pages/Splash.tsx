import Coin from '@/components/ui/Coin';

// Écran d'entrée mobile (visiteur non connecté). Plein écran, hors Layout :
// hero teal, pièce or flottante (élément signature), 2 chemins d'accès.
// Sur desktop, le visiteur va directement sur la LandingPage (pas de splash).
type Props = {
  onLogin: () => void;
  onRegister: () => void;
};

export default function Splash({ onLogin, onRegister }: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primo-hero-from via-primo-ink-900 to-primo-ink-950 px-7 pb-12 pt-12 text-white"
      style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Coin size={128} float />
        <h1 className="mt-10 text-[54px] font-extrabold leading-none tracking-[-0.04em]">Prim'O</h1>
        <p className="mt-4 max-w-[280px] text-[18px] font-medium leading-relaxed text-white/70">
          Tes efforts récompensés{' '}
          <span className="font-bold text-primo-gold-bright">instantanément</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onRegister}
          className="rounded-2xl bg-primo-teal py-[17px] text-base font-bold text-white shadow-[0_12px_26px_-8px_rgba(0,161,154,0.7)] transition active:scale-[0.99]"
        >
          Créer mon compte
        </button>
        <button
          type="button"
          onClick={onLogin}
          className="rounded-2xl border border-white/25 bg-white/[0.06] py-4 text-base font-bold text-white transition active:scale-[0.99]"
        >
          J'ai déjà un compte
        </button>
      </div>
    </div>
  );
}
