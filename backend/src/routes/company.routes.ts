import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getCompanyController } from '../controllers/company.controller';

const router = Router();

// GET /api/company - protégé (manager connecté)
router.get('/', requireAuth, getCompanyController);

export default router;
