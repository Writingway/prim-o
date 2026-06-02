import { prisma } from "../lib/db";

// Liste les employés rattachés à un employeur (hors employés supprimés).
// Ne renvoie jamais passwordHash ni invitationToken.
export async function listEmployeesByEmployer(employerId: string) {
  return prisma.employee.findMany({
    where: { employerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      tokenBalance: true,
      isEmailVerified: true,
      isSmsVerified: true,
      createdAt: true,
    },
  });
}
