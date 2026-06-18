import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { deleteAccountSchema, updateProfileSchema } from '../schemas/privacy.schemas';
import { exportUserData, deleteOwnAccount, updateOwnProfile, getMyProfile } from '../services/privacy.service';

// GET /api/me/export — l'utilisateur connecté télécharge toutes ses
// données personnelles (RGPD art. 15 & 20). L'id vient du JWT, jamais
// du client.
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

    // On force le téléchargement en fichier plutôt qu'un affichage inline.
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

// DELETE /api/me — suppression (anonymisation) du compte de l'utilisateur
// connecté, après confirmation par mot de passe (RGPD art. 17).
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

    // La session est terminée : on révoque le cookie refresh (même path
    // que l'émission, sinon le navigateur ne le supprime pas).
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

// PATCH /api/me — rectification du profil de l'utilisateur connecté (art. 16).
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

// GET /api/me — profil de l'utilisateur connecté.
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
