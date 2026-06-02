import bcrypt from "bcryptjs";
import {prisma} from "../lib/db";
import { signAccessToken, generateRefreshToken, REFRESH_TTL_MS, hashRefreshToken } from '../lib/token';
import type { LoginInput } from '../schemas/auth.schemas';
import type { RegisterManagerInput, RegisterEmployeeInput } from "../schemas/auth.schemas";


export async function registerManager(input: RegisterManagerInput) {
  const { companyName, email, password } = input;

  const existingManager = await prisma.manager.findUnique({ where: { email } });
  if (existingManager) {
    throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const manager = await prisma.manager.create({
    data: {
      companyName: input.companyName,
      email: input.email,
      passwordHash,
    },
  });

  return { id: manager.id, email: manager.email, companyName: manager.companyName };
};


export async function loginManager(input: LoginInput) {
  const { email, password } = input;

  const manager = await prisma.manager.findUnique({ where: { email } });

  if (!manager || !(await bcrypt.compare(password, manager.passwordHash))) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken(manager.id, 'MANAGER');
  const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      role: 'MANAGER',
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      managerId: manager.id,
    },
  });

  return { accessToken, refreshToken };
}

export async function loginEmployee(input: LoginInput) {
  const { email, password } = input;

  const employee = await prisma.employee.findUnique({ where: { email } });

  if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken(employee.id, 'EMPLOYEE');
  const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      role: 'EMPLOYEE',
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      employeeId: employee.id,
    },
  });

  return { accessToken, refreshToken };
}

export async function registerEmployee(input: RegisterEmployeeInput) {
  const { firstName, lastName, email, password, managerId } = input;

  const manager = await prisma.manager.findUnique({ where: { id: managerId } });
  if (!manager) {
    throw new Error('MANAGER_NOT_FOUND');
  }

  const existingEmployee = await prisma.employee.findUnique({ where: { email } });
  if (existingEmployee) {
    throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      managerId,
    },
  });

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    managerId: employee.managerId,
  };
};

export async function refreshTokens(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new Error('INVALID_REFRESH');

  // DÉTECTION DE VOL : token révoqué = quelqu'un réutilise un vieux token
  if (stored.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { managerId: stored.managerId, isRevoked: false },
      data: { isRevoked: true },
    });
    throw new Error('INVALID_REFRESH');
  }

  if (stored.expiresAt < new Date()) throw new Error('INVALID_REFRESH');

  // ROTATION atomique
  const { raw, hash } = generateRefreshToken();
  const newToken = await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        tokenHash: hash,
        role: stored.role,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        managerId: stored.managerId,
        employeeId: stored.employeeId,
      },
    });
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true, replacedById: created.id },
    });
    return created;
  });

  const userId = stored.managerId ?? stored.employeeId;
  if (!userId) throw new Error('INVALID_REFRESH');
  const accessToken = signAccessToken(userId, stored.role);

  return { accessToken, refreshToken: raw };
}


export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, isRevoked: false },
    data: { isRevoked: true },
  });
}
