import { z } from 'zod';
import { safeText } from '../lib/validation';
// Suppression de compte : on exige le mot de passe en confirmation
// d'une action irréversible (anonymisation). min(1) : on vérifie
// seulement la présence ici - la comparaison réelle se fait via
// bcrypt dans le service (deleteOwnAccount).
export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    firstName: safeText(2).optional(),
    lastName: safeText(2).optional(),
    email: z.email().optional(),
  })
  .refine(
    (d) => d.firstName !== undefined || d.lastName !== undefined || d.email !== undefined,
    { message: 'Aucun champ à mettre à jour.' },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
