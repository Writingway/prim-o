import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listMotifsController } from '../controllers/motif.controller';

const router = Router();

// §3.5 — tout utilisateur authentifié peut lire la liste (le manager en a besoin pour tagger).
router.get('/', requireAuth, listMotifsController);

export default router;
