import Icon from './Icon';

// Pièce-jeton Prim'O : dégradé or radial + étoile centrale. Élément signature,
// réservé au jeton / récompense. `float` pour les écrans de célébration.
type Props = {
  size?: number;
  float?: boolean;
  className?: string;
};

export default function Coin({ size = 44, float = false, className = '' }: Props) {
  return (
    <span
      className={`primo-coin inline-flex flex-none items-center justify-center rounded-full text-primo-ink-900 ${
        float ? 'animate-primo-float' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow:
          'inset 0 -6px 11px rgba(150,90,0,.4), inset 0 6px 9px rgba(255,255,255,.65), 0 8px 20px -6px rgba(232,148,23,.45)',
      }}
      aria-hidden
    >
      <Icon name="star" size={Math.round(size * 0.5)} />
    </span>
  );
}
