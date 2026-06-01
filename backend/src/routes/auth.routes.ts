import { Router } from 'express';
import { 
  registerEmployerController, 
  registerEmployeeController, 
  loginEmployerController,
  refreshController,
  logoutController
 } from '../controllers/auth.controller';

const router = Router();

router.post('/employer/register', registerEmployerController);
router.post('/employee/register', registerEmployeeController);
router.post('/employer/login', loginEmployerController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);


// Route protégée d'exemple (pour tester requireAuth) :
import { requireAuth } from '../middleware/auth.middleware';
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});


export default router;
