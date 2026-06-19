import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    return;
  }

  if (err instanceof ZodError || (err instanceof Error && err.name === 'ZodError')) {
    res.status(400).json({ error: 'Données invalides.', details: (err as ZodError).issues });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
