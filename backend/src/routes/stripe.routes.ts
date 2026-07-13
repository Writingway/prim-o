import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createCheckoutController } from '../controllers/stripe.controller';

const router = Router();

router.post('/checkout', requireAuth, createCheckoutController);

export default router;
