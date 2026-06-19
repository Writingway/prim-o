import { Router } from 'express';
import {
  registerCompanyController,
  registerUserController,
  refreshController,
  loginController,
  logoutController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController
 } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { refreshLimiter, loginLimiter, resendVerificationLimiter, passwordResetLimiter } from '../lib/rateLimit';

const router = Router();

router.post('/register-company', registerCompanyController);
router.post('/register-user', registerUserController);
router.post('/refresh', refreshLimiter, refreshController);
router.post('/login', loginLimiter, loginController);
router.post('/logout', logoutController);
router.get('/verify-email', verifyEmailController);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationController);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordController);
router.post('/reset-password', passwordResetLimiter, resetPasswordController);


router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});


export default router;
