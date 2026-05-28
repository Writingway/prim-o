import type { Request, Response, NextFunction } from 'express';
import { registerEmployerSchema } from '../schemas/auth.schemas';
import { registerEmployer } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';

export async function registerEmployerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerEmployerSchema.parse(req.body);
    const employer = await registerEmployer(input);
    res.status(201).json({ employer });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
      return;
    }
    next(err);
  }
}
