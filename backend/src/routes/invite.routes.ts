import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { generateInviteController } from '../controllers/invite.controller';
import { refreshLimiter, loginLimiter } from '../lib/rateLimit';

const router = Router();

// POST /api/invites/generate — protégé (manager connecté)
router.post('/generate', requireAuth, loginLimiter, generateInviteController);

export default router;
