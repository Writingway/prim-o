import { Router } from 'express';
import { registerEmployerController } from '../controllers/auth.controller';

const router = Router();

router.post('/employer/register', registerEmployerController);

export default router;
