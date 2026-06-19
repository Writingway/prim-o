import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
  listEmployeesByEmployer,
  softDeleteEmployee,
  getEmployeeBalance,
  getEmployeeReceived,
  getEmployeeSpent,
} from '../services/employee.service';
import { prisma } from '../lib/db';
import { requireManagerOrOwner } from '../middleware/authz';

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
    const companyId = requireManagerOrOwner(req, next);
    if (!companyId) return;

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
    const companyId = requireManagerOrOwner(req, next);
    if (!companyId) return;

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

// (Bonus) PATCH /api/employees/:id/approve — approuver un employé (manager connecté)
export async function approveEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId = requireManagerOrOwner(req, next);
    if (!companyId) return;

    const id = req.params.id;
    if (typeof id !== 'string') {
      next(new AppError(400, 'Identifiant employé manquant.'));
      return;
    }

    await approveEmployee(companyId, id);
    res.status(200).json({ message: 'Employé approuvé.' });
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

async function approveEmployee(companyId: string, employeeId: string) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, role: true, companyId: true, deletedAt: true, status: true },
  });

  if (!employee || employee.deletedAt !== null || employee.role !== 'EMPLOYEE') {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }

  // Cloison multi-tenant : on n'approuve que les employés de SA propre entreprise.
  if (employee.companyId !== companyId) {
    throw new Error('EMPLOYEE_NOT_IN_COMPANY');
  }

  await prisma.user.update({
    where: { id: employeeId },
    data: { status: 'APPROVED' },
  });
}