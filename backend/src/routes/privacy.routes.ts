import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  exportMyDataController,
  deleteMyAccountController,
  updateMyProfileController,
  getMyProfileController,
} from '../controllers/privacy.controller';


const router = Router();

// GET /api/me — profil courant (pré-remplit la rectification)
router.get('/', requireAuth, getMyProfileController);
// GET /api/me/export — export RGPD des données (art. 15 & 20)
router.get('/export', requireAuth, exportMyDataController);
// DELETE /api/me — suppression/anonymisation du compte (art. 17)
router.delete('/', requireAuth, deleteMyAccountController);
// PATCH /api/me — rectification du profil (art. 16)
router.patch('/', requireAuth, updateMyProfileController);

export default router;
