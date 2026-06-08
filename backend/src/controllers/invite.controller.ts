import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { generateInviteSchema } from '../schemas/invite.schemas';
import { generateInviteCode } from '../services/invite.service';

// POST /api/invites/generate — un manager génère un code d'invitation.
// companyId + createdById viennent du token (req.user), jamais du body.
export async function generateInviteController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.role !== 'MANAGER') {
      next(new AppError(403, 'Accès réservé aux manager.'));
      return;
    }

    const companyId = req.user.companyId;
    if (!companyId) {
      next(new AppError(403, 'Aucune entreprise associée.'));
      return;
    }

    const input = generateInviteSchema.parse(req.body ?? {});

    const invite = await generateInviteCode({
      companyId,
      createdById: req.user.id,
      maxUses: input.maxUses,
      expiresInHours: input.expiresInHours,
    });

    res.status(201).json({ invite });
  } catch (err) {
    if (err instanceof Error && err.message === 'CODE_GENERATION_FAILED') {
      next(new AppError(500, 'Impossible de générer un code, réessaie.'));
      return;
    }
    next(err);
  }
}
