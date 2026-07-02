import type { Request, Response, NextFunction } from 'express';
import { listActiveMotifs } from '../services/motif.service';

// GET /api/motifs — official list of active motifs (allocation reasons), grouped by category.
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
