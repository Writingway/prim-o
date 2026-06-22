import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listMotifsController } from '../controllers/motif.controller';

const router = Router();
router.get('/', requireAuth, listMotifsController);
export default router;
