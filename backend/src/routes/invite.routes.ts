import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { generateInviteController } from '../controllers/invite.controller';
import { generateLimiter } from '../lib/rateLimit';

const router = Router();

// POST /api/invites/generate — protégé (manager connecté)
router.post('/generate', requireAuth, generateLimiter, generateInviteController);

export default router;
