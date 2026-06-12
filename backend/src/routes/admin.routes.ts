import { Router } from 'express';
import {
  createOfferController,
  updateOfferController, deactivateOfferController,
} from '../controllers/offer.controller';

const router = Router();

// Mutations réservées à l'admin.
router.post('/offers', createOfferController);
router.patch('/offers/:id', updateOfferController);
router.delete('/offers/:id', deactivateOfferController);


export default router;
