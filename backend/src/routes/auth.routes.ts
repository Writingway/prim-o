import { Router } from 'express';
import {
  registerCompanyController,
  registerUserController,
  refreshController,
  loginController,
  logoutController,
  verifyEmailController
 } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { refreshLimiter, loginLimiter } from '../lib/rateLimit';

const router = Router();

router.post('/register-company', registerCompanyController);
router.post('/register-user', registerUserController);
router.post('/refresh', refreshLimiter, refreshController);
router.post('/login', loginLimiter, loginController);
router.post('/logout', logoutController);
router.get('/verify-email', verifyEmailController);


router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});


export default router;
