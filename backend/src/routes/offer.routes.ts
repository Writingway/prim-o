import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware';
import {
  listOffersController, 
  getOfferController, createOfferController,
  updateOfferController, deactivateOfferController,
} from '../controllers/offer.controller';

const router = Router();

// Lecture publique : vitrine de la landing + users connectés.
router.get('/', optionalAuth, listOffersController);
router.get('/:id', getOfferController);

// Mutations réservées à l'admin.
router.post('/', requireAuth, requireAdmin, createOfferController);
router.patch('/:id', requireAuth, requireAdmin, updateOfferController);
router.delete('/:id', requireAuth, requireAdmin, deactivateOfferController);


export default router;
