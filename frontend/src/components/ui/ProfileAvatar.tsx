import { avatarSrc } from '@/lib/avatars';

// Profile picture: the predefined avatar (round, bust-framed image) when the user
// picked one, otherwise falls back to their initials (teal gradient disc).
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
