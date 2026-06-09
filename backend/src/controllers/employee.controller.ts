import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
  listEmployeesByEmployer,
  softDeleteEmployee,
  getEmployeeBalance,
  getEmployeeReceived,
  getEmployeeSpent,
} from '../services/employee.service';

// Lit page/limit depuis la query, avec valeurs par défaut et bornes sûres.
function parsePaging(req: Request): { page: number; limit: number } {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { page, limit };
}

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

// Garde commun : seul un EMPLOYEE accède à ces routes. Renvoie l'id ou null.
function requireEmployee(req: Request, next: NextFunction): string | null {
  if (req.user?.role !== 'EMPLOYEE') {
    next(new AppError(403, 'Accès réservé aux employés.'));
    return null;
  }
  return req.user.id;
}

// GET /api/employees/me — solde de l'employé connecté.
export async function getEmployeeBalanceController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employeeId = requireEmployee(req, next);
    if (!employeeId) return;

    const balance = await getEmployeeBalance(employeeId);
    res.status(200).json({ balance });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMPLOYEE_NOT_FOUND') {
      next(new AppError(404, 'Employé introuvable.'));
      return;
    }
    next(err);
  }
}

// GET /api/employees/me/received — historique des tokens reçus, paginé.
export async function getEmployeeReceivedController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employeeId = requireEmployee(req, next);
    if (!employeeId) return;

    const { page, limit } = parsePaging(req);
    const result = await getEmployeeReceived(employeeId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/employees/me/spent — historique des dépenses, paginé.
export async function getEmployeeSpentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employeeId = requireEmployee(req, next);
    if (!employeeId) return;

    const { page, limit } = parsePaging(req);
    const result = await getEmployeeSpent(employeeId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
