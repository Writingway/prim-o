import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '../middleware/error.middleware';
import { createOfferSchema, updateOfferSchema } from '../schemas/offer.schemas';
import { listOffers, listActiveOffers, getOffer, createOffer, updateOffer, deactivateOffer, getActiveOffer, setOfferImage, clearOfferImage } from '../services/offer.service';
import { offerImageUpload, removeUploadedFile, OFFERS_PUBLIC_PREFIX } from '../lib/upload';


export async function listOffersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin (token via optionalAuth): full list, inactive offers included.
    // Public / other roles: active offers only (storefront view).
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
    const offer = req.user?.role === 'ADMIN'
    ? await getOffer(String(id))      // admin: everything, including deactivated offers
    : await getActiveOffer(String(id)); // public: active only, storefront fields
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
      return;
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

// Upload middleware: runs multer, then translates its errors (size/format) into meaningful
// HTTP responses instead of a generic 500.
export function uploadOfferImageMiddleware(req: Request, res: Response, next: NextFunction): void {
  offerImageUpload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(413, 'Image trop lourde (2 Mo maximum).')); return;
      }
      if (err instanceof Error && err.message === 'INVALID_IMAGE_TYPE') {
        next(new AppError(415, 'Format non supporté. Utilise JPG, PNG ou WebP.')); return;
      }
      next(err instanceof Error ? err : new AppError(400, 'Upload invalide.'));
      return;
    }
    next();
  });
}

export async function uploadOfferImageController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { id } = req.params;
  if (!id) { next(new AppError(400, 'ID de l\'offre requis.')); return; }
  if (!req.file) { next(new AppError(400, 'Aucune image fournie.')); return; }
  try {
    const offer = await setOfferImage(String(id), req.file.filename);
    res.json({ offer });
  } catch (err) {
    // On failure (offer not found or otherwise), remove the freshly uploaded file so it does
    // not orphan on disk.
    await removeUploadedFile(`${OFFERS_PUBLIC_PREFIX}/${req.file.filename}`);
    if (err instanceof Error && err.message === 'OFFER_NOT_FOUND') {
      next(new AppError(404, 'Offre non trouvée.')); return;
    }
    next(err);
  }
}

export async function deleteOfferImageController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { id } = req.params;
  if (!id) { next(new AppError(400, 'ID de l\'offre requis.')); return; }
  try {
    const offer = await clearOfferImage(String(id));
    res.json({ offer });
  } catch (err) {
    if (err instanceof Error && err.message === 'OFFER_NOT_FOUND') {
      next(new AppError(404, 'Offre non trouvée.')); return;
    }
    next(err);
  }
}
