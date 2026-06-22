import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { addPromoCodesSchema } from '../schemas/promoCode.schemas';
import { addPromoCodes, listPromoCodes, deletePromoCode } from '../services/promoCode.service';

// POST /api/admin/offers/:offerId/promo-codes - ajout en lot (admin).
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

// GET /api/admin/offers/:offerId/promo-codes - liste des codes d'une offre (admin).
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

// DELETE /api/admin/promo-codes/:id - supprime un code non utilisé (admin).
export async function deletePromoCodeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      next(new AppError(400, 'ID du code requis.'));
      return;
    }
    await deletePromoCode(String(id));
    res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'CODE_NOT_FOUND') { next(new AppError(404, 'Code introuvable.')); return; }
      if (err.message === 'CODE_USED') {
        next(new AppError(409, 'Impossible de supprimer un code déjà utilisé.'));
        return;
      }
    }
    next(err);
  }
}
