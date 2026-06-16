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
    if (req.user?.role !== 'MANAGER') {
      next(new AppError(403, 'Accès réservé aux managers.'));
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
    next(err);
  }
}
