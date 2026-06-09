import { prisma } from "../lib/db";

// Liste les employés rattachés à un employeur (hors employés supprimés).
// Ne renvoie jamais passwordHash ni invitationToken.
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

// Solde seul de l'employé. employeeId vient du JWT.
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

// Historique des tokens reçus (attributions), paginé.
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
        reason: true,
        createdAt: true,
        manager: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.attribution.count({ where: { employeeId } }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      createdAt: r.createdAt,
      managerName: `${r.manager.firstName ?? ''} ${r.manager.lastName ?? ''}`.trim(),
    })),
    total,
    page,
    hasMore: page * limit < total,
  };
}

// Historique des dépenses (redemptions), paginé.
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
      createdAt: s.createdAt,
      offerName: s.offer.partnerName,
      promoCode: s.promoCode.code,
    })),
    total,
    page,
    hasMore: page * limit < total,
  };
}
