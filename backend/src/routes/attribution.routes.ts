import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createAttributionController } from '../controllers/attribution.controller';

const router = Router();

router.post('/', requireAuth, createAttributionController);

export default router;
