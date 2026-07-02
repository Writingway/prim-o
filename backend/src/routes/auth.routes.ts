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

// Account-first signup: registration creates a floating user with no company. Email verification
// is required before the first login (no auto-login).
router.post('/register', registerController);
// Company membership (authenticated user): create a new company or join an existing one.
router.post('/create-company', requireAuth, createCompanyController);
router.post('/join-company', requireAuth, joinCompanyController);

router.post('/refresh', refreshLimiter, refreshController);
router.post('/login', loginLimiter, loginController);
router.post('/logout', logoutController);

router.get('/me', requireAuth, meController);

// Deliberately unauthenticated (the caller cannot log in yet). Dedicated rate limiters guard
// against email-sending abuse.
router.get('/verify-email', verifyEmailController);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationController);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordController);
router.post('/reset-password', passwordResetLimiter, resetPasswordController);


export default router;
