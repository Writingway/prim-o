import type { Request, Response, NextFunction } from 'express';
import { listActiveMotifs } from '../services/motif.service';

// GET /api/motifs — liste officielle des motifs actifs, groupés par catégorie.
export async function listMotifsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listActiveMotifs();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
