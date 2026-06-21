import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import type { RetributionMode } from '@prisma/client';
import type { CreateAttributionInput, DistributeEnvelopeInput } from '../schemas/attribution.schemas';
import { computeRetribution } from '../lib/retribution';

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
        // reason = champ legacy requis en DB ; le motif officiel (motifId) porte le sens.
        data: { amount, reason: reason ?? '', companyId, managerId: attributorId, employeeId },
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

// Allocation employeur → manager : débite le POOL entreprise et CRÉE une enveloppe
// (Allocation, statut A_DISTRIBUER). NE crédite PLUS le solde du manager : les tokens
// "vivent" dans l'enveloppe jusqu'à l'envoi (où R lui est crédité). Atomique + gardé.
export async function allocateToManager(
  companyId: string,
  createdById: string,
  managerId: string,
  amount: number,
  mode: RetributionMode,
  percentage: number | null,
) {
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

      const allocation = await tx.allocation.create({
        data: { amount, mode, percentage, companyId, managerId, createdById, status: 'A_DISTRIBUER' },
        select: { id: true, amount: true, mode: true, percentage: true, status: true },
      });
      const refreshed = await tx.company.findUnique({
        where: { id: companyId },
        select: { tokenBalance: true },
      });
      return { allocation, companyTokenBalance: refreshed?.tokenBalance ?? 0 };
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

// Envoi atomique d'une enveloppe : recalcule R, vérifie l'invariant Σ(montants) =
// montant − R, crédite le manager (R) + chaque employé, marque l'enveloppe DISTRIBUEE.
// Tout échec → rollback complet, l'enveloppe reste A_DISTRIBUER.
export async function distributeEnvelope(
  managerId: string,
  companyId: string,
  input: DistributeEnvelopeInput,
) {
  const { allocationId, lines } = input;
  return prisma.$transaction(async (tx) => {
    const alloc = await tx.allocation.findUnique({
      where: { id: allocationId },
      select: { id: true, amount: true, mode: true, percentage: true, status: true, managerId: true, companyId: true },
    });
    if (!alloc) throw new Error('ALLOCATION_NOT_FOUND');
    if (alloc.managerId !== managerId) throw new Error('ALLOCATION_NOT_OWNED');
    if (alloc.companyId !== companyId) throw new Error('ALLOCATION_NOT_IN_COMPANY');
    if (alloc.status !== 'A_DISTRIBUER') throw new Error('ALLOCATION_ALREADY_DISTRIBUTED');

    // nbEquipe = employés actifs de l'entreprise au moment de l'envoi (le manager = +1).
    const teamSize = await tx.user.count({
      where: { companyId, role: 'EMPLOYEE', deletedAt: null },
    });
    const retribution = computeRetribution({
      mode: alloc.mode,
      amount: alloc.amount,
      percentage: alloc.percentage,
      teamSize,
    });
    const budget = alloc.amount - retribution;

    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    if (total !== budget) throw new Error('DISTRIBUTION_MISMATCH');

    // Tous les destinataires doivent être des employés actifs de l'entreprise.
    const employeeIds = lines.map((l) => l.employeeId);
    const validEmployees = await tx.user.count({
      where: { id: { in: employeeIds }, companyId, role: 'EMPLOYEE', deletedAt: null },
    });
    if (validEmployees !== employeeIds.length) throw new Error('EMPLOYEE_INVALID');

    // Tous les motifs doivent exister et être actifs.
    const motifIds = [...new Set(lines.map((l) => l.motifId))];
    const validMotifs = await tx.motif.count({ where: { id: { in: motifIds }, active: true } });
    if (validMotifs !== motifIds.length) throw new Error('MOTIF_INVALID');

    // Crédit rétribution manager (solde perso).
    if (retribution > 0) {
      await tx.user.update({ where: { id: managerId }, data: { balance: { increment: retribution } } });
    }
    // Crédit employés + création des attributions, rattachées à l'enveloppe.
    for (const l of lines) {
      await tx.user.update({ where: { id: l.employeeId }, data: { balance: { increment: l.amount } } });
      await tx.attribution.create({
        data: {
          amount: l.amount,
          reason: l.reason ?? '',
          motifId: l.motifId,
          companyId,
          managerId,
          employeeId: l.employeeId,
          allocationId,
        },
      });
    }
    await tx.allocation.update({
      where: { id: allocationId },
      data: { status: 'DISTRIBUEE', retributionAmount: retribution, distributedAt: new Date() },
    });

    return { allocationId, retributionAmount: retribution, distributed: total, lineCount: lines.length, status: 'DISTRIBUEE' as const };
  });
}

// Liste les enveloppes d'un manager ("Mes enveloppes"). Pour A_DISTRIBUER, R et le
// budget sont calculés en direct (taille d'équipe courante) ; pour DISTRIBUEE on relit
// le R figé à l'envoi.
export async function listManagerEnvelopes(managerId: string, companyId: string) {
  const allocations = await prisma.allocation.findMany({
    where: { managerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, amount: true, mode: true, percentage: true, status: true,
      retributionAmount: true, distributedAt: true, createdAt: true,
    },
  });
  const teamSize = await prisma.user.count({ where: { companyId, role: 'EMPLOYEE', deletedAt: null } });
  return allocations.map((a) => {
    const retribution = a.status === 'DISTRIBUEE'
      ? a.retributionAmount
      : computeRetribution({ mode: a.mode, amount: a.amount, percentage: a.percentage, teamSize });
    return {
      allocationId: a.id,
      amount: a.amount,
      mode: a.mode,
      percentage: a.percentage,
      status: a.status,
      retributionAmount: retribution,
      distributableBudget: a.amount - retribution,
      distributedAt: a.distributedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    };
  });
}

// Doubles soldes manager (§3.3) : enveloppe restante (budget non distribué des
// enveloppes A_DISTRIBUER) + solde perso (rétribution cumulée = user.balance).
export async function getManagerBalances(managerId: string, companyId: string) {
  const user = await prisma.user.findUnique({ where: { id: managerId }, select: { balance: true } });
  const pending = await prisma.allocation.findMany({
    where: { managerId, status: 'A_DISTRIBUER' },
    select: { amount: true, mode: true, percentage: true },
  });
  const teamSize = await prisma.user.count({ where: { companyId, role: 'EMPLOYEE', deletedAt: null } });
  const envelopeRemaining = pending.reduce((sum, a) => {
    const r = computeRetribution({ mode: a.mode, amount: a.amount, percentage: a.percentage, teamSize });
    return sum + (a.amount - r);
  }, 0);
  return { envelopeRemaining, personalBalance: user?.balance ?? 0 };
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
