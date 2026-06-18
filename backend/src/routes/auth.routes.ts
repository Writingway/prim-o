import { Router } from 'express';
import {
  registerController,
  createCompanyController,
  joinCompanyController,
  refreshController,
  loginController,
  logoutController,
  meController,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { refreshLimiter, loginLimiter } from '../lib/rateLimit';

const router = Router();

// Account-first : inscription = utilisateur flottant, connecté immédiatement.
router.post('/register', registerController);
// Appartenance entreprise (utilisateur authentifié) : créer OU rejoindre.
router.post('/create-company', requireAuth, createCompanyController);
router.post('/join-company', requireAuth, joinCompanyController);

router.post('/refresh', refreshLimiter, refreshController);
router.post('/login', loginLimiter, loginController);
router.post('/logout', logoutController);

router.get('/me', requireAuth, meController);


export default router;
