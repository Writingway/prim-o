import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import type { CreateAttributionInput } from '../schemas/attribution.schemas';

export async function createAttribution(
  attributorId: string,
  attributorRole: string,
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

  // Vérification entreprise (doit être validée)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  if (company.status !== 'APPROVED') throw new Error('COMPANY_INACTIVE');

  try {
    return await prisma.$transaction(async (tx) => {
      if (attributorRole === 'OWNER') {
        // Le patron distribue depuis le POOL entreprise.
        const debit = await tx.company.updateMany({
          where: { id: companyId, tokenBalance: { gte: amount } },
          data: { tokenBalance: { decrement: amount } },
        });
        if (debit.count === 0) throw new Error('INSUFFICIENT_POOL');
      } else {
        // Le manager distribue depuis SON solde perso (alloué par le patron).
        const debit = await tx.user.updateMany({
          where: { id: attributorId, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (debit.count === 0) throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx.user.update({
        where: { id: employeeId },
        data: { balance: { increment: amount } },
      });

      return tx.attribution.create({
        data: { amount, reason, companyId, managerId: attributorId, employeeId },
        select: { id: true, amount: true, reason: true, createdAt: true },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      if (err.message.includes('company_pool_non_negative')) throw new Error('INSUFFICIENT_POOL');
      if (err.message.includes('user_balance_non_negative')) throw new Error('INSUFFICIENT_BALANCE');
    }
    throw err;
  }
}

// Allocation patron → manager : débite le POOL entreprise, crédite le solde du manager.
// Atomique + gardé. Le manager doit appartenir à l'entreprise du patron.
export async function allocateToManager(companyId: string, managerId: string, amount: number) {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, role: true, companyId: true, deletedAt: true },
  });
  if (!manager || manager.deletedAt !== null || manager.role !== 'MANAGER') {
    throw new Error('MANAGER_NOT_FOUND');
  }
  if (manager.companyId !== companyId) throw new Error('MANAGER_NOT_IN_COMPANY');

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  if (company.status !== 'APPROVED') throw new Error('COMPANY_INACTIVE');

  try {
    return await prisma.$transaction(async (tx) => {
      const debit = await tx.company.updateMany({
        where: { id: companyId, tokenBalance: { gte: amount } },
        data: { tokenBalance: { decrement: amount } },
      });
      if (debit.count === 0) throw new Error('INSUFFICIENT_POOL');

      return tx.user.update({
        where: { id: managerId },
        data: { balance: { increment: amount } },
        select: { id: true, firstName: true, lastName: true, balance: true },
      });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientUnknownRequestError &&
      err.message.includes('company_pool_non_negative')
    ) {
      throw new Error('INSUFFICIENT_POOL');
    }
    throw err;
  }
}

// Solde perso de l'utilisateur courant (manager : tokens alloués par le patron).
export async function getUserBalance(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
  return u?.balance ?? 0;
}

// Liste les managers d'une entreprise (pour l'allocation côté patron).
export async function listCompanyManagers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId, role: 'MANAGER', deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true, balance: true },
  });
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
