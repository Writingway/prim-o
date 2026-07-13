import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listEmployeesController,
  deleteEmployeeController,
  getEmployeeBalanceController,
  getEmployeeReceivedController,
  getEmployeeSpentController,
  setRedemptionUsedController
} from '../controllers/employee.controller';
import { redeemOfferController } from '../controllers/redemption.controller';

const router = Router();

router.get('/list', requireAuth, listEmployeesController);
// Soft delete.
router.delete('/:id', requireAuth, deleteEmployeeController);
// Employee self-service: balance plus paginated received/spent histories. The EMPLOYEE role check
// lives in the controllers.
router.get('/me', requireAuth, getEmployeeBalanceController);
router.get('/me/received', requireAuth, getEmployeeReceivedController);
router.get('/me/spent', requireAuth, getEmployeeSpentController);
// Toggle the "used" flag on one of the caller's redeemed codes.
router.patch('/me/spent/:id', requireAuth, setRedemptionUsedController);

// Exchange tokens for a promo code.
router.post('/me/redeem', requireAuth, redeemOfferController);

export default router;
