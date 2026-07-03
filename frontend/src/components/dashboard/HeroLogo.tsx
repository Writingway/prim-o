import logo3 from '@/assets/logos/logo_3.png';

// Centered white Prim'O wordmark (logo_3 is the asset with the normally black « prim »
// inverted to white), for dark backgrounds - dashboard heros and the footer.
export default function HeroLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={logo3}
      alt="Prim'O"
      className={`mx-auto h-10 w-auto ${className}`}
    />
  );
}
