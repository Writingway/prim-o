import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  listOffersController,
  getOfferController,
} from '../controllers/offer.controller';
import { listActiveCategoriesController } from '../controllers/category.controller';

const router = Router();

// Catégories publiques (utilisées par la vitrine).
router.get('/categories', listActiveCategoriesController);

// Lecture publique : vitrine de la landing + users connectés.
router.get('/', optionalAuth, listOffersController);
router.get('/:id', optionalAuth, getOfferController);

export default router;
