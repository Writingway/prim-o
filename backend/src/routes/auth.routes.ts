import { Router } from 'express';
import {
  registerManagerController,
  registerUserController,
  refreshController,
  loginController,
  logoutController
 } from '../controllers/auth.controller';

const router = Router();

router.post('/manager/register', registerManagerController);
router.post('/employee/register', registerUserController);
router.post('/refresh', refreshController);
router.post('/login', loginController);
router.post('/logout', logoutController);


import { requireAuth } from '../middleware/auth.middleware';
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});


export default router;
