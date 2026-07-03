import { describe, it, expect } from 'vitest';
import {
  updateUserSchema,
  companyStatusSchema,
  idParamSchema,
  listUsersQuerySchema,
} from '../../src/schemas/admin.schemas';

describe('updateUserSchema', () => {
  it('refuse un body vide (au moins un champ requis)', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
  });

  it('accepte role seul (MANAGER / EMPLOYEE)', () => {
    expect(updateUserSchema.safeParse({ role: 'MANAGER' }).success).toBe(true);
    expect(updateUserSchema.safeParse({ role: 'EMPLOYEE' }).success).toBe(true);
  });

  it('bloque la promotion ADMIN (anti-escalade de privilèges)', () => {
    expect(updateUserSchema.safeParse({ role: 'ADMIN' }).success).toBe(false);
  });

  it('accepte isEmailVerified seul', () => {
    expect(updateUserSchema.safeParse({ isEmailVerified: true }).success).toBe(true);
  });

  it("refuse l'ancien contrat status (champ inconnu, aucun champ valide)", () => {
    expect(updateUserSchema.safeParse({ status: 'REJECTED' }).success).toBe(false);
  });
});

describe('companyStatusSchema', () => {
  it('accepte APPROVED et REJECTED uniquement', () => {
    expect(companyStatusSchema.safeParse({ status: 'APPROVED' }).success).toBe(true);
    expect(companyStatusSchema.safeParse({ status: 'REJECTED' }).success).toBe(true);
    expect(companyStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('accepte un uuid, refuse le reste', () => {
    expect(idParamSchema.safeParse('00000000-0000-4000-8000-000000000000').success).toBe(true);
    expect(idParamSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('listUsersQuerySchema', () => {
  it('coerce page/limit et applique les défauts', () => {
    const parsed = listUsersQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(listUsersQuerySchema.parse({ page: '3', limit: '50' })).toMatchObject({ page: 3, limit: 50 });
  });

  it('refuse limit > 100 et page < 1', () => {
    expect(listUsersQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(listUsersQuerySchema.safeParse({ page: '0' }).success).toBe(false);
  });
});
