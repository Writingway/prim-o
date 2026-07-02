import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getStatsController } from '../controllers/stats.controller';

const router = Router();

// §3.2 — employer back-office. requireAuth here; the OWNER role check lives in the controller.
router.get('/', requireAuth, getStatsController);

export default router;
