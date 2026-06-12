import { Router } from 'express';
import {
  registerManagerController,
  registerUserController,
  refreshController,
  loginController,
  logoutController
 } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { refreshLimiter, loginLimiter } from '../lib/rateLimit';

const router = Router();

router.post('/manager/register', registerManagerController);
router.post('/employee/register', registerUserController);
router.post('/refresh', refreshLimiter, refreshController);
router.post('/login', loginLimiter, loginController);
router.post('/logout', logoutController);


router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});


export default router;
