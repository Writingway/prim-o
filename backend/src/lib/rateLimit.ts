import rateLimit from 'express-rate-limit';

// Each rateLimit() call creates its OWN in-memory counter: one limiter per use case, so
// budgets are never shared between routes.

// Integration tests chain logins and requests: skip the limiters in
// NODE_ENV=test (never the case in prod, enforced by config.ts).
const skipInTest = () => process.env.NODE_ENV === 'test';

// Login: protects against password brute force.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de tentatives de connexion, réessaie dans 15 minutes.' },
});

// Refresh: hit on every page load (F5), hence the larger budget.
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
});

// Invite code generation: prevents a manager (or a stolen token) from flooding the DB with
// codes.
export const generateLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de codes générés, réessaie dans 1 minute.' },
});

// Verification email resend: prevents flooding someone's mailbox.
export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de demandes, réessaie dans 15 minutes.' },
});

// Forgot password / reset: guards against both email flooding and token brute force.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false, skip: skipInTest,
  message: { error: 'Trop de demandes, réessaie dans 15 minutes.' },
});

