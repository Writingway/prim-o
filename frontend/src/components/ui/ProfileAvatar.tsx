import { avatarSrc } from '@/lib/avatars';

// Photo de profil : avatar prédéfini (image ronde, cadrée buste) si l'utilisateur
// en a choisi un, sinon repli sur ses initiales (pastille dégradée teal).
type Props = {
  photo?: string | null;
  initials?: string;
  size?: number;
  className?: string;
};

export default function ProfileAvatar({ photo, initials = '?', size = 40, className = '' }: Props) {
  const src = avatarSrc(photo);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`flex-none rounded-full bg-primo-mint object-cover ${className}`}
        draggable={false}
        aria-hidden
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={`flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-primo-teal-100 to-primo-teal-strong font-extrabold text-white ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
