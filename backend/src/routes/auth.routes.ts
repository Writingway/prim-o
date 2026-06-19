import { Router } from 'express';
import {
  registerController,
  createCompanyController,
  joinCompanyController,
  refreshController,
  loginController,
  logoutController,
  meController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  refreshLimiter,
  loginLimiter,
  resendVerificationLimiter,
  passwordResetLimiter,
} from '../lib/rateLimit';

const router = Router();

// Account-first : inscription = utilisateur flottant. Vérification email requise
// avant la première connexion (pas d'auto-login).
router.post('/register', registerController);
// Appartenance entreprise (utilisateur authentifié) : créer OU rejoindre.
router.post('/create-company', requireAuth, createCompanyController);
router.post('/join-company', requireAuth, joinCompanyController);

router.post('/refresh', refreshLimiter, refreshController);
router.post('/login', loginLimiter, loginController);
router.post('/logout', logoutController);

router.get('/me', requireAuth, meController);

// Public (utilisateur non connecté). Limiteurs dédiés contre l'abus d'envoi d'emails.
router.get('/verify-email', verifyEmailController);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationController);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordController);
router.post('/reset-password', passwordResetLimiter, resetPasswordController);


export default router;
