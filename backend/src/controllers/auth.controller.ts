import type { Request, Response, NextFunction } from 'express';
import { registerEmployerSchema, registerEmployeeSchema } from '../schemas/auth.schemas';
import { registerEmployer, registerEmployee } from '../services/auth.service';
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

export async function registerEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerEmployeeSchema.parse(req.body);
    const employee = await registerEmployee(input);
    res.status(201).json({ employee });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMPLOYER_NOT_FOUND') {
      next(new AppError(404, 'Employeur introuvable.'));
      return;
    }
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      next(new AppError(409, 'Email déjà utilisé.'));
      return;
    }
    next(err);
  }
}
