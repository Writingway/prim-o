import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

const safeText = (min: number) =>
  z.string()
    .transform((v) => sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} }).trim())
    .pipe(z.string().min(min));

export const createAttributionSchema = z.object({
  employeeId: z.string().uuid(),
  amount:     z.number().int().positive(),
  reason:     safeText(1),
});

export type CreateAttributionInput = z.infer<typeof createAttributionSchema>;
