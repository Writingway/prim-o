import bcrypt from "bcryptjs";
import {prisma} from "../lib/db";
import type { RegisterEmployerInput } from "../schemas/auth.schemas";

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
