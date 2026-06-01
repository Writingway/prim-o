import bcrypt from "bcryptjs";
import {prisma} from "../lib/db";
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
