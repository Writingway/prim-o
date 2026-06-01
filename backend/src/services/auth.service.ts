import bcrypt from "bcryptjs";
import {prisma} from "../lib/db";
import { signAccessToken, generateRefreshToken, REFRESH_TTL_MS, hashRefreshToken } from '../lib/token';
import type { LoginInput } from '../schemas/auth.schemas';
import type { RegisterEmployerInput, RegisterEmployeeInput } from "../schemas/auth.schemas";


export async function registerEmployer(input: RegisterEmployerInput) {
  const { companyName, email, password } = input;
  
  // Vérifier si l'employeur existe déjà
  const existingEmployer = await prisma.employer.findUnique({
    where: { email },
  });
  if (existingEmployer) {
    throw new Error('EMAIL_TAKEN');
  }

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, 10);

  // Créer l'employeur
  const employer = await prisma.employer.create({
    data: {
      companyName: input.companyName,
      email: input.email,
      passwordHash,
    },
  });

  return { id: employer.id, email: employer.email, companyName: employer.companyName };
};


export async function loginEmployer(input: LoginInput) {
  const { email, password } = input;

  // 1. Trouver l'employer par email
  const employer = await prisma.employer.findUnique({ where: { email } });

  // 2. Vérifier mot de passe — MÊME erreur si introuvable OU mauvais mdp
  //    bcrypt.compare(password, employer.passwordHash) -> Promise<boolean>
  if (!employer || !(await bcrypt.compare(password, employer.passwordHash))) {
    throw new Error('INVALID_CREDENTIALS');
  }
  // 3. Émettre access token (employer.id, 'EMPLOYER')
  const accessToken = signAccessToken(employer.id, 'EMPLOYER');
  // 4. Générer refresh (raw + hash)
  const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
  // 5. Stocker le HASH en DB avec expiration
  //    prisma.refreshToken.create({ data: { tokenHash, role, expiresAt, employerId } })
  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      role: 'EMPLOYER',
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      employerId: employer.id,
    },
  });
  // 6. Retourner { accessToken, refreshToken: raw }
  return { accessToken, refreshToken };
}
export async function loginEmployee(input: LoginInput) {
  const { email, password } = input;

  // Même logique que loginEmployer, mais sur la table Employee / rôle EMPLOYEE.
  const employee = await prisma.employee.findUnique({ where: { email } });

  // Même erreur si introuvable OU mauvais mdp (ne pas révéler quel email existe)
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
  const { firstName, lastName, email, password, employerId } = input;

  // Vérifier que l'employeur existe
  const employer = await prisma.employer.findUnique({
    where: { id: employerId },
  });
  if (!employer) {
    throw new Error('EMPLOYER_NOT_FOUND');
  }

  // Vérifier si l'employé existe déjà
  const existingEmployee = await prisma.employee.findUnique({
    where: { email },
  });
  if (existingEmployee) {
    throw new Error('EMAIL_TAKEN');
  }

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, 10);

  // Créer l'employé (non vérifié : email + SMS à valider plus tard)
  const employee = await prisma.employee.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      employerId,
    },
  });

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    employerId: employee.employerId,
  };
};

export async function refreshTokens(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  // a) introuvable
  if (!stored) throw new Error('INVALID_REFRESH');

  // b) DÉTECTION DE VOL : token connu mais déjà révoqué = quelqu'un réutilise un vieux token
  if (stored.isRevoked) {
    // révoque tous les refresh actifs de cet user (coupe l'attaquant ET la victime)
    await prisma.refreshToken.updateMany({
      where: { employerId: stored.employerId, isRevoked: false },
      data: { isRevoked: true },
    });
    throw new Error('INVALID_REFRESH');
  }

  // c) expiré
  if (stored.expiresAt < new Date()) throw new Error('INVALID_REFRESH');

  // d) ROTATION — atomique (transaction)
  const { raw, hash } = generateRefreshToken();
  const newToken = await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        tokenHash: hash,
        role: stored.role,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        employerId: stored.employerId,
        employeeId: stored.employeeId,
      },
    });
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true, replacedById: created.id },
    });
    return created;
  });

  // e) nouvel access — qui est l'user ? employer ou employee
  const userId = stored.employerId ?? stored.employeeId;
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
