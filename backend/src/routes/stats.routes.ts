import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getStatsController } from '../controllers/stats.controller';

const router = Router();

// §3.2 — back-office employeur. requireAuth ici ; le contrôle OWNER est dans le controller.
router.get('/', requireAuth, getStatsController);

export default router;
