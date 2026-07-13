import { Router, Request, Response, NextFunction } from 'express';
import z from 'zod';
import { prisma } from '../lib/db';

// Routes de test UNIQUEMENT : montées par app.ts hors production.
// Permet aux tests d'intégration (tests/integration) de passer la
// vérification email sans boîte mail - flip direct du flag en DB.
const router = Router();

const verifyEmailSchema = z.object({ email: z.email() });

router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = verifyEmailSchema.parse(req.body);
    const result = await prisma.user.updateMany({
      where: { email, deletedAt: null },
      data: { isEmailVerified: true },
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }
    res.json({ verified: true });
  } catch (err) {
    next(err);
  }
});

export default router;
