import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { redeemSchema } from '../schemas/redemption.schemas';
import { redeemOffer } from '../services/redemption.service';

// POST /api/employees/me/redeem — exchange tokens for a promo code.
export async function redeemOfferController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Purchase is open to employees AND managers (a manager spends their personal tokens).
    // Owners and admins do not consume offers.
    if (req.user?.role !== 'EMPLOYEE' && req.user?.role !== 'MANAGER') {
      next(new AppError(403, 'Achat réservé aux employés et aux managers.'));
      return;
    }
    const companyId = req.user.companyId;
    if (!companyId) {
      next(new AppError(403, 'Aucune entreprise associée à ce compte.'));
      return;
    }

    const { offerId } = redeemSchema.parse(req.body);
    const result = await redeemOffer(req.user.id, companyId, offerId);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        OFFER_NOT_FOUND:      [404, 'Offre introuvable ou inactive.'],
        OUT_OF_STOCK:         [409, 'Plus aucun code disponible pour cette offre.'],
        INSUFFICIENT_BALANCE: [409, 'Solde de tokens insuffisant.'],
      };
      const mapped = map[err.message];
      if (mapped) { next(new AppError(mapped[0], mapped[1])); return; }
    }
    next(err);
  }
}
