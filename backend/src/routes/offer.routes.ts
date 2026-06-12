import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  listOffersController,
  getOfferController,
} from '../controllers/offer.controller';

const router = Router();

// Lecture publique : vitrine de la landing + users connectés.
router.get('/', optionalAuth, listOffersController);
router.get('/:id', optionalAuth, getOfferController);

export default router;
