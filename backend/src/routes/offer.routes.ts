import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  listOffersController, getOfferController, createOfferController,
  updateOfferController, deactivateOfferController,
} from '../controllers/offer.controller';

const router = Router();

router.use(requireAuth, requireAdmin);  // tout admin-only

router.get('/', listOffersController);
router.get('/:id', getOfferController);
router.post('/', createOfferController);
router.patch('/:id', updateOfferController);
router.delete('/:id', deactivateOfferController);

export default router;
