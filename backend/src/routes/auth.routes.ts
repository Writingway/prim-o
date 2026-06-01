import { Router } from 'express';
import { registerEmployerController, registerEmployeeController } from '../controllers/auth.controller';

const router = Router();

router.post('/employer/register', registerEmployerController);
router.post('/employee/register', registerEmployeeController);

export default router;
