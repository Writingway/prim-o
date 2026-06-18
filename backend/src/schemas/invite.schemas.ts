import { z } from 'zod';

// Génération d'un code d'invitation par un manager.
// Tout est borné côté serveur : on ne fait jamais confiance au client.
//  - maxUses  : plafond d'inscriptions autorisées avec ce code (anti-abus).
//  - expiresInHours : durée de validité. Par défaut 24h (règle métier),
//    plafonné à 7 jours.
export const generateInviteSchema = z.object({
  maxUses: z.number().int().min(1).max(100).optional().default(5),
  expiresInHours: z.number().int().min(1).max(24).optional().default(24),
  role: z.enum(['EMPLOYEE', 'MANAGER']).optional().default('EMPLOYEE'),
});

export type GenerateInviteInput = z.infer<typeof generateInviteSchema>;
