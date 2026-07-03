import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  exportMyDataController,
  deleteMyAccountController,
  updateMyProfileController,
  getMyProfileController,
} from '../controllers/privacy.controller';


const router = Router();

// Current profile; pre-fills the GDPR rectification form.
router.get('/', requireAuth, getMyProfileController);
// GDPR data export (art. 15 & 20).
router.get('/export', requireAuth, exportMyDataController);
// Account deletion/anonymisation (art. 17).
router.delete('/', requireAuth, deleteMyAccountController);
// Profile rectification (art. 16).
router.patch('/', requireAuth, updateMyProfileController);

export default router;
