import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import type { CreateAttributionInput } from '../schemas/attribution.schemas';

export async function createAttribution(
  managerId: string,
  companyId: string,
  input: CreateAttributionInput,
) {
  const { employeeId, amount, reason } = input;

  // Vérification employé
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, role: true, companyId: true, deletedAt: true },
  });

  if (!employee || employee.deletedAt !== null || employee.role !== 'EMPLOYEE') {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }
  if (employee.companyId !== companyId) {
    throw new Error('EMPLOYEE_NOT_IN_COMPANY');
  }

  // Vérification pool entreprise
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { tokenBalance: true, status: true },
  });

  if (!company) throw new Error('COMPANY_NOT_FOUND');
  if (company.status !== 'APPROVED') throw new Error('COMPANY_INACTIVE');
  if (company.tokenBalance - amount < 0) throw new Error('INSUFFICIENT_POOL');


  try {
    return await prisma.$transaction(async (tx) => {
      const debit = await tx.company.updateMany({
        where: { id: companyId, tokenBalance: { gte: amount } },
        data: { tokenBalance: { decrement: amount } },
      });
      if (debit.count === 0) {
        throw new Error('INSUFFICIENT_POOL');
      }
      await tx.user.update({
        where: { id: employeeId },
        data: { balance: { increment: amount } },
      });

      return tx.attribution.create({
        data: { amount, reason, companyId, managerId, employeeId },
        select: { id: true, amount: true, reason: true, createdAt: true },
      });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientUnknownRequestError &&
      (err.message.includes('company_pool_non_negative') ||
        err.message.includes('user_balance_non_negative'))
    ) {
      throw new Error('INSUFFICIENT_POOL');
    }
    throw err;
  }
}

// Historique des attributions d'une entreprise (récentes d'abord).
export async function listAttributionsByCompany(companyId: string) {
  return prisma.attribution.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      reason: true,
      createdAt: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });
}
