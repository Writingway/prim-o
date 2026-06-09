import { Router } from 'express';
import { listOffersController } from '../controllers/offer.controller';

const router = Router();

// GET /api/offers — public (vitrine)
router.get('/', listOffersController);

export default router;
