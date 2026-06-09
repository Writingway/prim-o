import type { Request, Response, NextFunction } from 'express';
import { listActiveOffers } from '../services/offer.service';

// GET /api/offers — vitrine publique des offres partenaires actives (pas d'auth).
export async function listOffersController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const offers = await listActiveOffers();
    res.status(200).json({ offers });
  } catch (err) {
    next(err);
  }
}
