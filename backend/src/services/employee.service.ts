import { prisma } from "../lib/db";
import { anonymizeUser } from './privacy.service';


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

// Soft delete d'un employé (deletedAt), uniquement s'il appartient à l'entreprise du manager.
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
        createdAt: true,
        manager: { select: { firstName: true, lastName: true } },
        motif: { select: { compliment: true } },
      },
    }),
    prisma.attribution.count({ where: { employeeId } }),
  ]);

  return {
    // `reason` = compliment du motif (texte montré au salarié) ; le texte libre n'existe plus.
    items: rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.motif?.compliment ?? '',
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

// Bascule manuelle du statut « utilisé » d'un code, par son propriétaire.
// On filtre sur employeeId pour garantir qu'on ne touche que SES redemptions.
export async function setRedemptionUsed(employeeId: string, redemptionId: string, used: boolean) {
  const result = await prisma.redemption.updateMany({
    where: { id: redemptionId, employeeId },
    data: { used },
  });
  if (result.count === 0) throw new Error('REDEMPTION_NOT_FOUND');
  return { id: redemptionId, used };
}
