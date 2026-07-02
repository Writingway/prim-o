// Predefined avatars (already cropped to bust). The key (`av_1`…`av_6`) is what is stored in the
// database (User.profilePhoto); the frontend maps it back to the image asset.
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

// Maps a (possibly unknown or null) key to its image URL, or null when there is no avatar.
export function avatarSrc(key: string | null | undefined): string | null {
  if (!key) return null;
  return SRC[key as AvatarKey] ?? null;
}
