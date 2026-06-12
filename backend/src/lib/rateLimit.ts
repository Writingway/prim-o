import rateLimit from 'express-rate-limit';

// Chaque appel à rateLimit() crée son PROPRE compteur en mémoire.
// Un limiteur par usage : les budgets ne se partagent jamais entre routes.

// Connexion : protège contre le brute force de mots de passe.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, réessaie dans 15 minutes.' },
});

// Refresh : appelé à chaque chargement de page (F5) → budget plus large.
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
});

// Génération de codes d'invitation : empêche un manager (ou un token volé)
// de flooder la DB de codes.
export const generateLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Trop de codes générés, réessaie dans 1 minute.' },
});

