import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.middleware';
import { generateInviteController } from '../controllers/invite.controller';

const router = Router();

// Limiteur dédié : empêche un manager (ou un token volé) de flooder
// la DB de codes d'invitation. Plus strict que le limiteur global.
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de codes générés, réessaie dans 1 minute.' },
});

// POST /api/invites/generate — protégé (manager connecté)
router.post('/generate', requireAuth, generateLimiter, generateInviteController);

export default router;
