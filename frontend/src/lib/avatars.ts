// Avatars prédéfinis (déjà cadrés buste). La clé (`av_1`…`av_6`) est ce qui est
// stocké en base (champ User.profilePhoto) ; le front la mappe vers l'image.
import av1 from '@/assets/avatars/av_1.png';
import av2 from '@/assets/avatars/av_2.png';
import av3 from '@/assets/avatars/av_3.png';
import av4 from '@/assets/avatars/av_4.png';
import av5 from '@/assets/avatars/av_5.png';
import av6 from '@/assets/avatars/av_6.png';

export type AvatarKey = 'av_1' | 'av_2' | 'av_3' | 'av_4' | 'av_5' | 'av_6';

export const AVATARS: { key: AvatarKey; src: string }[] = [
  { key: 'av_1', src: av1 },
  { key: 'av_2', src: av2 },
  { key: 'av_3', src: av3 },
  { key: 'av_4', src: av4 },
  { key: 'av_5', src: av5 },
  { key: 'av_6', src: av6 },
];

const SRC: Record<AvatarKey, string> = {
  av_1: av1, av_2: av2, av_3: av3, av_4: av4, av_5: av5, av_6: av6,
};

// Clé (potentiellement inconnue/nulle) → URL de l'image, ou null si pas d'avatar.
export function avatarSrc(key: string | null | undefined): string | null {
  if (!key) return null;
  return SRC[key as AvatarKey] ?? null;
}
