import rateLimit from 'express-rate-limit';

// Chaque appel à rateLimit() crée son PROPRE compteur en mémoire.
// Un limiteur par usage : les budgets ne se partagent jamais entre routes.

// Les tests d'intégration enchaînent logins et requêtes : on saute les
// limiteurs en NODE_ENV=test (jamais le cas en prod, forcé par config.ts).
const skipInTest = () => process.env.NODE_ENV === 'test';

// Connexion : protège contre le brute force de mots de passe.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de tentatives de connexion, réessaie dans 15 minutes.' },
});

// Refresh : appelé à chaque chargement de page (F5) → budget plus large.
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
});

// Génération de codes d'invitation : empêche un manager (ou un token volé)
// de flooder la DB de codes.
export const generateLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de codes générés, réessaie dans 1 minute.' },
});

// Renvoi d'email de vérification : empêche de flooder une boîte mail.
export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de demandes, réessaie dans 15 minutes.' },
});

// Mot de passe oublié / reset : flood d'emails + brute-force de tokens.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de demandes, réessaie dans 15 minutes.' },
});

