import coinSrc from '@/assets/primotoken/primo-tkn1.png';

// Pièce-token Prim'O : rendu 3D officiel (src/assets/primotoken/primo-tkn1.png, importé
// → vérifié au build + hashé par Vite). Élément signature, réservé au token /
// récompense. `float` pour les écrans de célébration. L'image porte déjà ses
// reflets et son ombre.
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
