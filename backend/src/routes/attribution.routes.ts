import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createAttributionController,
  listAttributionsController,
} from '../controllers/attribution.controller';

const router = Router();

router.post('/', requireAuth, createAttributionController);
router.get('/', requireAuth, listAttributionsController);

export default router;
