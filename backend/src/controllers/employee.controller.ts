import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { listEmployeesByEmployer, softDeleteEmployee } from '../services/employee.service';

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

// DELETE /api/employees/:id — soft delete d'un employé de l'entreprise du manager.
export async function deleteEmployeeController(
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

    const id = req.params.id;
    if (typeof id !== 'string') {
      next(new AppError(400, 'Identifiant employé manquant.'));
      return;
    }

    await softDeleteEmployee(companyId, id);
    res.status(204).end();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'EMPLOYEE_NOT_FOUND') {
        next(new AppError(404, 'Employé introuvable.'));
        return;
      }
      if (err.message === 'EMPLOYEE_NOT_IN_COMPANY') {
        next(new AppError(403, "Cet employé n'appartient pas à votre entreprise."));
        return;
      }
    }
    next(err);
  }
}
