import { Router, Request, Response, NextFunction } from 'express';
import z from 'zod';
import { prisma } from '../lib/db';

// Test routes ONLY: mounted by app.ts outside production.
// Lets integration tests (tests/integration) pass email
// verification without a mailbox - direct flip of the flag in DB.
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
