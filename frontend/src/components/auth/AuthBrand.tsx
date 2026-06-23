import Coin from '../ui/Coin';

// En-tête de marque des écrans d'auth : pièce-jeton + Prim'O + sous-titre optionnel.
export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <Coin size={56} />
      <h1 className="mt-3 text-[28px] font-extrabold tracking-[-0.03em] text-primo-ink">Prim'O</h1>
      {subtitle && <p className="mt-1.5 text-sm text-primo-slate-soft">{subtitle}</p>}
    </div>
  );
}
