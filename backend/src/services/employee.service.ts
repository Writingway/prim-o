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

  await prisma.user.update({
    where: { id: employeeId },
    data: { deletedAt: new Date() },
  });
}
