import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { createOfferSchema, updateOfferSchema } from '../schemas/offer.schemas';
import { listOffers, listActiveOffers, getOffer, createOffer, updateOffer, deactivateOffer } from '../services/offer.service';


export async function listOffersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin (token via optionalAuth) : liste complète, inactives comprises.
    // Public / autres rôles : uniquement les offres actives (vitrine).
    const offers = req.user?.role === 'ADMIN' ? await listOffers() : await listActiveOffers();
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}

export async function getOfferController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      next(new AppError(400, 'ID de l\'offre requis.')); 
      return;
    }
    const offer = await getOffer(String(id));
    if (!offer) {
      next(new AppError(404, 'Offre non trouvée.'));
      return;
    }
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function createOfferController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createOfferSchema.parse(req.body);
    const offer = await createOffer(data);
    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function updateOfferController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      next(new AppError(400, 'ID de l\'offre requis.')); 
      return;
    }
    const data = updateOfferSchema.parse(req.body);
    const offer = await updateOffer(String(id), data);
    res.json({ offer });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      next(new AppError(404, 'Offre non trouvée.'));
    }
    next(err);
  }
}

export async function deactivateOfferController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      next(new AppError(400, 'ID de l\'offre requis.')); 
      return;
    }
    const offer = await deactivateOffer(String(id));
    res.json({ offer });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      next(new AppError(404, 'Offre introuvable.')); return;
    }
    next(err);
  }
}
