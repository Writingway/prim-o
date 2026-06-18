import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { createCheckoutSchema } from '../schemas/stripe.schemas';
import { createCheckoutSession } from '../services/stripe.service';

export async function createCheckoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user?.role !== 'OWNER') {
      next(new AppError(403, "Seul le patron peut recharger le pool de l'entreprise."));
      return;
    }

    const companyId = req.user.companyId;
    if (!companyId) {
      next(new AppError(403, 'Aucune entreprise associée à ce compte.'));
      return;
    }

    const input = createCheckoutSchema.parse(req.body);

    const url = await createCheckoutSession(req.user.id, companyId, input.amount);
    res.status(200).json({ url });
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_INACTIVE') {
      next(new AppError(403, 'Entreprise non validée.'));
      return;
    }
    next(err);
  }
}
