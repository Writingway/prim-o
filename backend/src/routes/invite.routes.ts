import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { generateInviteController } from '../controllers/invite.controller';
import { generateLimiter } from '../lib/rateLimit';

const router = Router();

// Rate-limited so a manager (or a stolen token) cannot flood the DB with invite codes.
router.post('/generate', requireAuth, generateLimiter, generateInviteController);

export default router;
