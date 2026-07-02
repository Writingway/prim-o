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

// Envelope flow: the owner allocates tokens to a manager, who then redistributes them to
// employees; the list routes feed the owner and manager dashboards. Owner/manager role checks
// live in the controllers.
router.post('/allocate', requireAuth, allocateController);
router.post('/distribute', requireAuth, distributeEnvelopeController);
router.get('/managers', requireAuth, listManagersController);
router.get('/envelopes', requireAuth, listEnvelopesController);
router.get('/balances', requireAuth, balancesController);
router.get('/sent-envelopes', requireAuth, listSentEnvelopesController);

export default router;
