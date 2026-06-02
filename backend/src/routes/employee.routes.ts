import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listEmployeesController } from '../controllers/employee.controller';

const router = Router();

// GET /api/employees — protégé (employeur connecté)
router.get('/list', requireAuth, listEmployeesController);

export default router;
