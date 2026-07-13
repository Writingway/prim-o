import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  listOffersController,
  getOfferController,
} from '../controllers/offer.controller';
import { listActiveCategoriesController } from '../controllers/category.controller';

const router = Router();

// Deliberately public: used by the landing page showcase.
router.get('/categories', listActiveCategoriesController);

// Public reads: serve both the landing page showcase and logged-in users, hence optionalAuth.
router.get('/', optionalAuth, listOffersController);
router.get('/:id', optionalAuth, getOfferController);

export default router;
