import logo3 from '@/assets/logos/logo_3.png';

// Wordmark Prim'O en blanc (le « prim » noir est inversé en blanc), centré.
// Affiché en tête des heros des 3 dashboards — source unique pour éviter la
// répétition.
export default function HeroLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={logo3}
      alt="Prim'O"
      className={`mx-auto h-10 w-auto ${className}`}
    />
  );
}
