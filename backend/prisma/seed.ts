import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Vider dans l'ordre (FK oblige)
  await prisma.redemption.deleteMany()
  await prisma.attribution.deleteMany()
  await prisma.promoCode.deleteMany()
  await prisma.partnerOffer.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.manager.deleteMany()
  await prisma.admin.deleteMany()

  // ── Managers ──────────────────────────────────────────────
  const acme = await prisma.manager.create({
    data: {
      companyName: 'Acme',
      email: 'boss@acme.fr',
      passwordHash: await bcrypt.hash('password123', 10),
      balance: 500,
      isEmailVerified: true,
      isSmsVerified: true,
    },
  })

  await prisma.manager.create({
    data: {
      companyName: 'TestCo',
      email: 'test@testco.fr',
      passwordHash: await bcrypt.hash('password123', 10),
      balance: 200,
      isEmailVerified: true,
      isSmsVerified: true,
    },
  })

  // ── Employees ─────────────────────────────────────────────
  const jean = await prisma.employee.create({
    data: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@acme.fr',
      passwordHash: await bcrypt.hash('password123', 10),
      balance: 0,
      isEmailVerified: true,
      isSmsVerified: true,
      managerId: acme.id,
    },
  })

  const marie = await prisma.employee.create({
    data: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@acme.fr',
      passwordHash: await bcrypt.hash('password123', 10),
      balance: 50,
      isEmailVerified: true,
      isSmsVerified: true,
      managerId: acme.id,
    },
  })

  // ── Partner Offers ────────────────────────────────────────
  const amazon = await prisma.partnerOffer.create({
    data: {
      partnerName: 'Amazon',
      cost: 20,
      valueEuros: 20.00,
      category: 'E-commerce',
      isActive: true,
    },
  })

  const netflix = await prisma.partnerOffer.create({
    data: {
      partnerName: 'Netflix',
      cost: 15,
      valueEuros: 15.99,
      category: 'Streaming',
      isActive: true,
    },
  })

  // ── Attributions ──────────────────────────────────────────
  await prisma.attribution.createMany({
    data: [
      {
        amount: 30,
        reason: 'Excellent travail sur le projet client Q1',
        managerId: acme.id,
        employeeId: jean.id,
      },
      {
        amount: 50,
        reason: 'Dépassement des objectifs de vente',
        managerId: acme.id,
        employeeId: marie.id,
      },
    ],
  })

  // ── Promo Codes ───────────────────────────────────────────
  await prisma.promoCode.createMany({
    data: [
      { code: 'AMAZON-SEED-001', offerId: amazon.id },
      { code: 'AMAZON-SEED-002', offerId: amazon.id },
      { code: 'NETFLIX-SEED-001', offerId: netflix.id },
    ],
  })

  console.log('✅ Seed terminé.')
  console.log('   Managers  : Acme (boss@acme.fr), TestCo (test@testco.fr)')
  console.log('   Employees : jean.dupont@acme.fr, marie.martin@acme.fr')
  console.log('   Offers    : Amazon (20€), Netflix (15.99€)')
  console.log('   Codes     : AMAZON-SEED-001, AMAZON-SEED-002, NETFLIX-SEED-001')
  console.log('   Password  : password123 (tous)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
