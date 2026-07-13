import { prisma } from "../lib/db";
import { anonymizeUser } from './privacy.service';


// Never returns passwordHash or invitationToken.
export async function listEmployeesByEmployer(companyId: string) {
  return prisma.user.findMany({
    where: { role: 'EMPLOYEE', companyId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      balance: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });
}

// Removing an employee means GDPR anonymization (see privacy.service), never a hard delete.
// Only allowed for employees of the caller's own company.
export async function softDeleteEmployee(companyId: string, employeeId: string) {
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

  await prisma.$transaction(async (tx) => {
    await anonymizeUser(tx, employeeId);
  });
}

// employeeId comes from the JWT, never from client input.
export async function getEmployeeBalance(employeeId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { balance: true, deletedAt: true },
  });
  if (!user || user.deletedAt !== null) {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }
  return user.balance;
}

export async function getEmployeeReceived(employeeId: string, page: number, limit: number) {
  const [rows, total] = await Promise.all([
    prisma.attribution.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        manager: { select: { firstName: true, lastName: true, profilePhoto: true } },
        motif: { select: { compliment: true } },
      },
    }),
    prisma.attribution.count({ where: { employeeId } }),
  ]);

  return {
    // `reason` is the motif's compliment (the text shown to the employee); free-text
    // reasons no longer exist.
    items: rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.motif?.compliment ?? '',
      createdAt: r.createdAt,
      managerName: `${r.manager.firstName ?? ''} ${r.manager.lastName ?? ''}`.trim(),
      managerPhoto: r.manager.profilePhoto ?? null,
    })),
    total,
    page,
    hasMore: page * limit < total,
  };
}

export async function getEmployeeSpent(employeeId: string, page: number, limit: number) {
  const [rows, total] = await Promise.all([
    prisma.redemption.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        amount: true,
        used: true,
        createdAt: true,
        offer: { select: { partnerName: true } },
        promoCode: { select: { code: true } },
      },
    }),
    prisma.redemption.count({ where: { employeeId } }),
  ]);

  return {
    items: rows.map((s) => ({
      id: s.id,
      amount: s.amount,
      used: s.used,
      createdAt: s.createdAt,
      offerName: s.offer.partnerName,
      promoCode: s.promoCode.code,
    })),
    total,
    page,
    hasMore: page * limit < total,
  };
}

// Manual toggle of a code's "used" flag by its owner. Filtering on employeeId
// guarantees an employee can only touch their OWN redemptions.
export async function setRedemptionUsed(employeeId: string, redemptionId: string, used: boolean) {
  const result = await prisma.redemption.updateMany({
    where: { id: redemptionId, employeeId },
    data: { used },
  });
  if (result.count === 0) throw new Error('REDEMPTION_NOT_FOUND');
  return { id: redemptionId, used };
}
