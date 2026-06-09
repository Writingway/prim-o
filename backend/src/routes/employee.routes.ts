import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listEmployeesController,
  deleteEmployeeController,
  getEmployeeBalanceController,
  getEmployeeReceivedController,
  getEmployeeSpentController,
} from '../controllers/employee.controller';

const router = Router();

// GET /api/employees/list — protégé (manager connecté)
router.get('/list', requireAuth, listEmployeesController);
// DELETE /api/employees/:id — soft delete (manager connecté)
router.delete('/:id', requireAuth, deleteEmployeeController);

// Espace employé : solde + historiques paginés.
router.get('/me', requireAuth, getEmployeeBalanceController);
router.get('/me/received', requireAuth, getEmployeeReceivedController);
router.get('/me/spent', requireAuth, getEmployeeSpentController);

export default router;
