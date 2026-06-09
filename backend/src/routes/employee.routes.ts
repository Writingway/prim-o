import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listEmployeesController,
  getEmployeeBalanceController,
  getEmployeeReceivedController,
  getEmployeeSpentController,
} from '../controllers/employee.controller';

const router = Router();

// GET /api/employees — protégé (employeur connecté)
router.get('/list', requireAuth, listEmployeesController);

// Espace employé : solde + historiques paginés.
router.get('/me', requireAuth, getEmployeeBalanceController);
router.get('/me/received', requireAuth, getEmployeeReceivedController);
router.get('/me/spent', requireAuth, getEmployeeSpentController);

export default router;
