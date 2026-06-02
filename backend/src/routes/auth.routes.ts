import { Router } from 'express';
import {
  registerManagerController,
  registerEmployeeController,
  loginManagerController,
  loginEmployeeController,
  refreshController,
  logoutController
 } from '../controllers/auth.controller';

const router = Router();

router.post('/manager/register', registerManagerController);
router.post('/employee/register', registerEmployeeController);
router.post('/manager/login', loginManagerController);
router.post('/employee/login', loginEmployeeController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);


import { requireAuth } from '../middleware/auth.middleware';
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});


export default router;
