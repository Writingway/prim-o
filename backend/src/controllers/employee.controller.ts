import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { listEmployeesByEmployer } from '../services/employee.service';

// GET /api/employees — liste les employés de l'employeur connecté.
// L'employerId vient du token (req.user), jamais d'une entrée client.
export async function listEmployeesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.role !== 'EMPLOYER') {
      next(new AppError(403, 'Accès réservé aux employeurs.'));
      return;
    }

    const employees = await listEmployeesByEmployer(req.user.id);
    res.status(200).json({ employees });
  } catch (err) {
    next(err);
  }
}
