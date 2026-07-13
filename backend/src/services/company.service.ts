import { prisma } from "../lib/db";

export async function getCompany(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, tokenBalance: true },
  });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return company;
}
