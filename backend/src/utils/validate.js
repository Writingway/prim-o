import sanitizeHtml from 'sanitize-html';

/**
 * Wrapper Zod — valide req.body contre un schéma Zod.
 * Retourne 400 avec les erreurs si invalide.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Données invalides.',
      details: result.error.flatten().fieldErrors,
    });
  }
  // Sanitize toutes les chaînes du body parsé
  req.body = sanitizeObject(result.data);
  next();
};

/**
 * Sanitize récursif : échappe les chaînes HTML dans un objet.
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} });
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)]));
  }
  return obj;
}
