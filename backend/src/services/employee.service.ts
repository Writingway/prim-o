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
