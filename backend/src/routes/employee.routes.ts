import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listEmployeesController,
  deleteEmployeeController,
  getEmployeeBalanceController,
  getEmployeeReceivedController,
  getEmployeeSpentController,
  approveEmployeeController
} from '../controllers/employee.controller';
import { redeemOfferController } from '../controllers/redemption.controller';

const router = Router();

// GET /api/employees/list — protégé (manager connecté)
router.get('/list', requireAuth, listEmployeesController);
// DELETE /api/employees/:id — soft delete (manager connecté)
router.delete('/:id', requireAuth, deleteEmployeeController);
// PATCH /api/employees/:id/approve — approuver un employé (manager connecté)
router.patch('/:id/approve', requireAuth, approveEmployeeController);

// Espace employé : solde + historiques paginés.
router.get('/me', requireAuth, getEmployeeBalanceController);
router.get('/me/received', requireAuth, getEmployeeReceivedController);
router.get('/me/spent', requireAuth, getEmployeeSpentController);

// Échange de tokens contre un code promo (employé connecté).
router.post('/me/redeem', requireAuth, redeemOfferController);

export default router;
