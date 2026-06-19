import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';   // add to existing imports
import type { 
  ListUsersQuery, 
  UpdateUserInput, 
  PaginationQuery, 
  CreateCompanyInput 
} from '../schemas/admin.schemas';


// Global dashboard stats for the admin (not scoped to one company).
export async function getStats() {
  const [companies, users, managers] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, role: 'MANAGER' } }),
  ]);
  return { companies, users, managers };
}

// List all companies for the admin, with how many users each has.
export async function listCompanies(q: PaginationQuery) {
  const where = { deletedAt: null };
  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,   // how many rows to jump over
      take: q.limit,                  // how many to return
      select: {
        id: true, name: true, tokenBalance: true, status: true, createdAt: true,
        _count: { select: { users: true } },
      },
    }),
    prisma.company.count({ where }),  // total, so the UI knows page count
  ]);
  return { items, total, page: q.page, hasMore: q.page * q.limit < total };
}

// Global ledger: every token attribution across ALL companies (admin view).
export async function listAttributions(q: PaginationQuery) {
  const where = {};   // no filter -> admin sees everything
  const [items, total] = await Promise.all([
    prisma.attribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        company:  { select: { name: true } },                    // just the name
        manager:  { select: { firstName: true, lastName: true } }, // not the whole row
        employee: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.attribution.count({ where }),
  ]);
  return { items, total, page: q.page, hasMore: q.page * q.limit < total };
}


// Create a new company. Only the name is required; tokenBalance defaults to 0.  
export async function createCompany(data: CreateCompanyInput) {
  return prisma.company.create({
    data: { name: data.name, status: 'APPROVED' },   // créée par l'admin = active d'emblée
    select: { id: true, name: true, tokenBalance: true, status: true, createdAt: true },
  });
}

// Validation d'entreprise (file d'attente admin) : PENDING -> APPROVED/REJECTED.
export async function setCompanyStatus(companyId: string, status: 'APPROVED' | 'REJECTED') {
  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { id: true },
  });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return prisma.company.update({
    where: { id: companyId },
    data: { status },
    select: { id: true, name: true, status: true },
  });
}

// Soft-delete a company and everything tied to it, atomically.
// Keeps the append-only ledgers (Attribution/Redemption/CompanyTokenPurchase)
// intact for audit - we only flag deletedAt and kill sessions.
export async function softDeleteCompany(companyId: string) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.findFirst({
      where: { id: companyId, deletedAt: null },   // not found OR already deleted -> 404
      select: { id: true },
    });
    if (!company) throw new Error('COMPANY_NOT_FOUND');

    const now = new Date();

    // 1. which users to kill (need ids to target their tokens)
    const users = await tx.user.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    // 2. soft-delete the users (frees their email via the partial unique index)
    await tx.user.updateMany({
      where: { companyId, deletedAt: null },
      data: { deletedAt: now },
    });

    // 3. revoke their refresh tokens -> no session survives past the 15-min access TTL
    if (userIds.length > 0) {
      await tx.refreshToken.updateMany({
        where: { userId: { in: userIds }, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    // 4. revoke live invite codes -> nobody signs up into a dead company
    await tx.companyInviteCode.updateMany({
      where: { companyId, revokedAt: null },
      data: { revokedAt: now },
    });

    // 5. finally flag the company
    await tx.company.update({
      where: { id: companyId },
      data: { deletedAt: now },
    });

    return { companyId, usersDeleted: userIds.length };
  });
}

// Reverse a cascade soft-delete. Only restores users killed by THIS
// company-deletion (same deletedAt timestamp). Sessions stay revoked:
// users must log in again - safer, and the tokens were short-lived anyway.
export async function restoreCompany(companyId: string) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.findFirst({
      where: { id: companyId, deletedAt: { not: null } },   // must be deleted
      select: { id: true, deletedAt: true },
    });
    if (!company) throw new Error('COMPANY_NOT_DELETED');    // not found OR alive

    const deletedAt = company.deletedAt!;   // exact cascade timestamp

    const usersToRestore = await tx.user.findMany({
      where: { companyId, deletedAt },      // only the cascade victims
      select: { id: true, email: true },
    });

    // Guard: while the company was dead, someone may have re-registered
    // with the same email (now an ACTIVE row). Restoring would create two
    // active rows sharing an email -> violates the partial unique index.
    // Catch it first to return a clear error instead of a raw P2002 500.
    const emails = usersToRestore.map((u) => u.email);
    const clashes = await tx.user.findMany({
      where: { email: { in: emails }, deletedAt: null },
      select: { email: true },
    });
    if (clashes.length > 0) {
      throw new Error(`EMAIL_TAKEN:${clashes.map((c) => c.email).join(', ')}`);
    }

    await tx.user.updateMany({
      where: { companyId, deletedAt },
      data: { deletedAt: null },
    });
    await tx.company.update({
      where: { id: companyId },
      data: { deletedAt: null },
    });

    return { companyId, usersRestored: usersToRestore.length };
  });
}

// Single source of truth for what an admin may see about a user.
// passwordHash is NOT here - never leak it.
const ADMIN_SAFE_SELECT = {
  id: true, email: true, role: true,
  firstName: true, lastName: true, balance: true,
  isEmailVerified: true, companyId: true, createdAt: true,
} as const;

export async function listUsers(q: ListUsersQuery) {
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (q.role)      where.role = q.role;
  if (q.companyId) where.companyId = q.companyId;
  if (q.search)    where.email = { contains: q.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit, take: q.limit,
      select: ADMIN_SAFE_SELECT,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page: q.page, hasMore: q.page * q.limit < total };
}

export async function updateUser(id: string, data: UpdateUserInput) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, role: true, companyId: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    const nextRole = data.role;

    // Cet endpoint ne peut affecter que MANAGER/EMPLOYEE (jamais ADMIN, anti-escalade) :
    // un rôle non-ADMIN exige toujours une entreprise.
    if (user.companyId === null) {
      throw new Error('ROLE_REQUIRES_COMPANY');
    }

    // Last-admin guard : rétrograder le dernier admin actif est interdit.
    const losesAdmin = user.role === 'ADMIN';
    if (losesAdmin) {
      const admins = await tx.user.count({
        where: { role: 'ADMIN', deletedAt: null },
      });
      if (admins <= 1) throw new Error('LAST_ADMIN');
    }

    const updated = await tx.user.update({
      where: { id }, data: { role: nextRole },
      select: ADMIN_SAFE_SELECT,
    });

    // Changement de rôle -> on coupe les sessions (le token au rôle périmé meurt).
    if (nextRole !== user.role) {
      await tx.refreshToken.updateMany({
        where: { userId: id, isRevoked: false }, data: { isRevoked: true },
      });
    }
    return updated;
  });
}

export async function softDeleteUser(id: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    if (user.role === 'ADMIN') {
      const admins = await tx.user.count({
        where: { role: 'ADMIN', deletedAt: null },
      });
      if (admins <= 1) throw new Error('LAST_ADMIN');
    }

    await tx.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.refreshToken.updateMany({
      where: { userId: id, isRevoked: false }, data: { isRevoked: true },
    });
    return { id };
  });
}

// Global ledger: every redemption (offer purchase) across ALL companies.
export async function listRedemptions(q: PaginationQuery) {
  const where = {};
  const [items, total] = await Promise.all([
    prisma.redemption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        company:   { select: { name: true } },
        employee:  { select: { firstName: true, lastName: true } },
        offer:     { select: { partnerName: true } },
        promoCode: { select: { code: true } },
      },
    }),
    prisma.redemption.count({ where }),
  ]);
  return { items, total, page: q.page, hasMore: q.page * q.limit < total };
}

// Global ledger: every Stripe top-up recorded in DB (admin view).
// Filtré sur stripeSessionId != null → uniquement les vrais paiements Stripe
// (exclut d'éventuels crédits manuels sans session).
export async function listPurchases(q: PaginationQuery) {
  const where: Prisma.CompanyTokenPurchaseWhereInput = { stripeSessionId: { not: null } };
  const [items, total] = await Promise.all([
    prisma.companyTokenPurchase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: {
        id: true,
        amount: true,
        note: true,
        stripeSessionId: true,
        createdAt: true,
        company:   { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.companyTokenPurchase.count({ where }),
  ]);
  return { items, total, page: q.page, hasMore: q.page * q.limit < total };
}
