import logo1 from '../../assets/logos/logo_1.png';

export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <img src={logo1} alt="Prim'O" className="h-26 w-auto" />
      {subtitle && <p className="mt-3 text-sm text-primo-slate-soft">{subtitle}</p>}
    </div>
  );
}
