import type { Request, Response } from 'express';
import { listMotifs } from '../services/motif.service';

// GET /api/motifs — liste officielle groupée par catégorie (§3.5).
// requireAuth en amont, pas de body. Express 5 propage toute erreur async au middleware central.
export async function listMotifsController(_req: Request, res: Response): Promise<void> {
  const motifs = await listMotifs();
  res.json(motifs);
}
