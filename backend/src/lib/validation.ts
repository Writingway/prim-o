import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Zod string that strips ALL HTML (XSS guard) and trims, then enforces the minimum length on
// the sanitized result — so markup alone cannot satisfy a non-empty check.
export const safeText = (min: number) =>
  z.string()
    .transform((v) => sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} }).trim())
    .pipe(z.string().min(min));