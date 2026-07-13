import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { deleteAccountSchema, updateProfileSchema } from '../schemas/privacy.schemas';
import { exportUserData, deleteOwnAccount, updateOwnProfile, getMyProfile } from '../services/privacy.service';

// GET /api/me/export - the connected user downloads all their personal data (GDPR art. 15
// & 20). The id comes from the JWT, never from the client.
export async function exportMyDataController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(new AppError(401, 'Non authentifié.'));
      return;
    }

    const data = await exportUserData(userId);

    // Force a file download rather than inline display.
    res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees.json"');
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      next(new AppError(404, 'Utilisateur introuvable.'));
      return;
    }
    next(err);
  }
}

// DELETE /api/me - delete (anonymize) the connected user's account, after password
// confirmation (GDPR art. 17).
export async function deleteMyAccountController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(new AppError(401, 'Non authentifié.'));
      return;
    }

    const { password } = deleteAccountSchema.parse(req.body);
    await deleteOwnAccount(userId, password);

    // The session is over: clear the refresh cookie with the same path it was issued with,
    // otherwise the browser will not remove it.
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'USER_NOT_FOUND') {
        next(new AppError(404, 'Utilisateur introuvable.'));
        return;
      }
      if (err.message === 'INVALID_PASSWORD') {
        next(new AppError(401, 'Mot de passe incorrect.'));
        return;
      }
    }
    next(err);
  }
}

// PATCH /api/me - rectify the connected user's profile (GDPR art. 16).
export async function updateMyProfileController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(new AppError(401, 'Non authentifié.'));
      return;
    }

    const input = updateProfileSchema.parse(req.body);
    const profile = await updateOwnProfile(userId, input);
    res.status(200).json({ profile });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'USER_NOT_FOUND') {
        next(new AppError(404, 'Utilisateur introuvable.'));
        return;
      }
      if (err.message === 'EMAIL_TAKEN') {
        next(new AppError(409, 'Cet email est déjà utilisé.'));
        return;
      }
    }
    next(err);
  }
}

// GET /api/me - the connected user's profile.
export async function getMyProfileController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(new AppError(401, 'Non authentifié.'));
      return;
    }
    const profile = await getMyProfile(userId);
    res.status(200).json({ profile });
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      next(new AppError(404, 'Utilisateur introuvable.'));
      return;
    }
    next(err);
  }
}
