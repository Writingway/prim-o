import bcrypt from "bcryptjs";
import {prisma} from "../lib/db";
import type { RegisterEmployerInput } from "../schemas/auth.schemas";
import { signAccessToken, generateRefreshToken, REFRESH_TTL_MS } from '../lib/token';
import type { LoginInput } from '../schemas/auth.schemas';


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
