import { z } from 'zod';
import { safeText } from '../lib/validation';
// Account deletion requires the password to confirm an irreversible action (anonymisation).
// min(1) only checks presence - the actual comparison is done with bcrypt in the service
// (deleteOwnAccount).
export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

// Predefined avatars (front-end assets av_1…av_6). null resets the photo back to initials.
export const PROFILE_PHOTOS = ['av_1', 'av_2', 'av_3', 'av_4', 'av_5', 'av_6'] as const;

export const updateProfileSchema = z
  .object({
    firstName: safeText(2).optional(),
    lastName: safeText(2).optional(),
    email: z.email().optional(),
    profilePhoto: z.enum(PROFILE_PHOTOS).nullable().optional(),
  })
  .refine(
    (d) =>
      d.firstName !== undefined ||
      d.lastName !== undefined ||
      d.email !== undefined ||
      d.profilePhoto !== undefined,
    { message: 'Aucun champ à mettre à jour.' },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
