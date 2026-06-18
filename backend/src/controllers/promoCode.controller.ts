import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { addPromoCodesSchema } from '../schemas/promoCode.schemas';
import { addPromoCodes, listPromoCodes } from '../services/promoCode.service';

// POST /api/admin/offers/:offerId/promo-codes — ajout en lot (admin).
export async function addPromoCodesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { offerId } = req.params;
    if (!offerId) {
      next(new AppError(400, "ID de l'offre requis."));
      return;
    }
    const { codes } = addPromoCodesSchema.parse(req.body);
    const result = await addPromoCodes(String(offerId), codes);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'OFFER_NOT_FOUND') {
      next(new AppError(404, 'Offre introuvable.'));
      return;
    }
    next(err);
  }
}

// GET /api/admin/offers/:offerId/promo-codes — liste des codes d'une offre (admin).
export async function listPromoCodesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { offerId } = req.params;
    if (!offerId) {
      next(new AppError(400, "ID de l'offre requis."));
      return;
    }
    const codes = await listPromoCodes(String(offerId));
    res.json({ codes });
  } catch (err) {
    if (err instanceof Error && err.message === 'OFFER_NOT_FOUND') {
      next(new AppError(404, 'Offre introuvable.'));
      return;
    }
    next(err);
  }
}
