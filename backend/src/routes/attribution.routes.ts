import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createAttributionController,
  listAttributionsController,
  allocateController,
  listManagersController,
  distributeEnvelopeController,
  listEnvelopesController,
  balancesController,
  listSentEnvelopesController,
} from '../controllers/attribution.controller';

const router = Router();

router.post('/', requireAuth, createAttributionController);
router.get('/', requireAuth, listAttributionsController);

// Allocation patron → manager + liste des managers (pour l'UI patron).
router.post('/allocate', requireAuth, allocateController);
router.post('/distribute', requireAuth, distributeEnvelopeController);
router.get('/managers', requireAuth, listManagersController);
router.get('/envelopes', requireAuth, listEnvelopesController);
router.get('/balances', requireAuth, balancesController);
router.get('/sent-envelopes', requireAuth, listSentEnvelopesController);

export default router;
