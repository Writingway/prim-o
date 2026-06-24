import { z } from 'zod';
import { safeText } from '../lib/validation';
// Suppression de compte : on exige le mot de passe en confirmation
// d'une action irréversible (anonymisation). min(1) : on vérifie
// seulement la présence ici - la comparaison réelle se fait via
// bcrypt dans le service (deleteOwnAccount).
export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

// Avatars prédéfinis (fichiers front av_1…av_6). null = retour aux initiales.
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
