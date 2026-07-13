import coinSrc from '@/assets/primotoken/primo-tkn1.png';

// Prim'O token coin: the official 3D render (src/assets/primotoken/primo-tkn1.png,
// imported so Vite verifies and hashes it at build time). Signature element, reserved
// for the token / reward. `float` is meant for celebration screens. The image already
// carries its own highlights and shadow.
type Props = {
  size?: number;
  float?: boolean;
  className?: string;
};

export default function Coin({ size = 44, float = false, className = '' }: Props) {
  return (
    <img
      src={coinSrc}
      alt=""
      width={size}
      height={size}
      className={`inline-block flex-none select-none ${float ? 'animate-primo-float' : ''} ${className}`}
      style={{ filter: 'drop-shadow(0 8px 18px rgba(232,148,23,0.35))' }}
      draggable={false}
      aria-hidden
    />
  );
}
