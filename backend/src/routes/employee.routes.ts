import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listEmployeesController, deleteEmployeeController } from '../controllers/employee.controller';

const router = Router();

// GET /api/employees/list — protégé (manager connecté)
router.get('/list', requireAuth, listEmployeesController);
// DELETE /api/employees/:id — soft delete (manager connecté)
router.delete('/:id', requireAuth, deleteEmployeeController);

export default router;
