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
    if (req.user?.role !== 'MANAGER') {
      next(new AppError(403, 'Accès réservé aux manager.'));
      return;
    }

    const companyId = req.user?.companyId;
    if (!companyId) {
      next(new AppError(403, 'Aucune entreprise associée.'));
      return;
    }

    const employees = await listEmployeesByEmployer(companyId);
    res.status(200).json({ employees });
  } catch (err) {
    next(err);
  }
}
