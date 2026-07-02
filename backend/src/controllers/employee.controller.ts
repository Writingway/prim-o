import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
  listEmployeesByEmployer,
  softDeleteEmployee,
  getEmployeeBalance,
  getEmployeeReceived,
  getEmployeeSpent,
  setRedemptionUsed,
} from '../services/employee.service';
import { prisma } from '../lib/db';
import { requireManagerOrOwner } from '../middleware/authz';

function parsePaging(req: Request): { page: number; limit: number } {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { page, limit };
}

// GET /api/employees — employees of the connected employer. The company scope comes from the
// token (req.user), never from client input.
export async function listEmployeesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    const employees = await listEmployeesByEmployer(ctx.companyId);
    res.status(200).json({ employees });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/employees/:id — soft-delete an employee of the caller's company.
export async function deleteEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ctx = requireManagerOrOwner(req, next);
    if (!ctx) return;

    const id = req.params.id;
    if (typeof id !== 'string') {
      next(new AppError(400, 'Identifiant employé manquant.'));
      return;
    }

    await softDeleteEmployee(ctx.companyId, id);
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

// Guard for EMPLOYEE-only routes; returns the user id, or null after replying 403.
function requireEmployee(req: Request, next: NextFunction): string | null {
  if (req.user?.role !== 'EMPLOYEE') {
    next(new AppError(403, 'Accès réservé aux employés.'));
    return null;
  }
  return req.user.id;
}

// GET /api/employees/me — the connected employee's balance.
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


// GET /api/employees/me/received — paginated history of received tokens.
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

// GET /api/employees/me/spent — paginated spending history.
export async function getEmployeeSpentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // "Mes achats" is self-scoped to the current user, so any authenticated user may call it
    // (both employees and managers buy codes).
    const userId = req.user!.id;
    const { page, limit } = parsePaging(req);
    const result = await getEmployeeSpent(userId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/employees/me/spent/:id — toggle a code's "used" flag (redemption owner only).
export async function setRedemptionUsedController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = req.params.id;
    const used = req.body?.used;
    if (typeof id !== 'string' || typeof used !== 'boolean') {
      next(new AppError(400, 'Paramètres invalides (id, used booléen requis).'));
      return;
    }
    const result = await setRedemptionUsed(userId, id, used);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'REDEMPTION_NOT_FOUND') {
      next(new AppError(404, 'Code introuvable.'));
      return;
    }
    next(err);
  }
}

// No manager-approval endpoint by design (spec §4): the invitation code itself is the
// authorization, so an employee is active immediately after joining.