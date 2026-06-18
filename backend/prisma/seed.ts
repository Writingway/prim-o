import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Coût bcrypt conforme CLAUDE.md (>= 12)
const hash = (pwd: string) => bcrypt.hash(pwd, 12)

async function main() {
  console.log('🌱 Seeding database...')

  // Vider dans l'ordre (FK oblige)
  await prisma.redemption.deleteMany()
  await prisma.attribution.deleteMany()
  await prisma.companyTokenPurchase.deleteMany()
  await prisma.companyInviteCode.deleteMany()
  await prisma.promoCode.deleteMany()
  await prisma.partnerOffer.deleteMany()
  await prisma.emailVerificationToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  // ── Admin ─────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@primo.fr',
      passwordHash: await hash('password123'),
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
      // companyId null : seul l'ADMIN n'a pas d'entreprise
    },
  })

  // ── Entreprises (pool initial à 0, crédité ensuite par l'admin) ──
  const acme = await prisma.company.create({ data: { name: 'Acme', status: 'APPROVED' } })
  const testco = await prisma.company.create({ data: { name: 'TestCo', status: 'APPROVED' } })

  // ── Recharge du pool par l'admin (D2 : ledger d'achats) ───
  // Le pool est alimenté UNIQUEMENT via CompanyTokenPurchase + increment.
  await prisma.$transaction([
    prisma.companyTokenPurchase.create({
      data: { amount: 100, note: 'Crédit initial', companyId: acme.id, createdById: admin.id },
    }),
    prisma.company.update({ where: { id: acme.id }, data: { tokenBalance: { increment: 100 } } }),
    prisma.companyTokenPurchase.create({
      data: { amount: 100, note: 'Crédit initial', companyId: testco.id, createdById: admin.id },
    }),
    prisma.company.update({ where: { id: testco.id }, data: { tokenBalance: { increment: 100 } } }),
  ])

  // ── Managers (pas de solde : le solde vit sur Company) ────
  const bossAcme = await prisma.user.create({
    data: {
      email: 'boss@acme.fr',
      passwordHash: await hash('password123'),
      role: 'OWNER',
      firstName: 'Boss',
      lastName: 'Acme',
      status: 'APPROVED',
      isEmailVerified: true,
      companyId: acme.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'test@testco.fr',
      passwordHash: await hash('password123'),
      role: 'OWNER',
      firstName: 'Test',
      lastName: 'Co',
      status: 'APPROVED',
      isEmailVerified: true,
      companyId: testco.id,
    },
  })

  // Manager
  const managerAcme = await prisma.user.create({
    data: {
      email: 'manager@acme.fr',
      passwordHash: await hash('password123'),
      role: 'MANAGER',
      firstName: 'Luc',
      lastName: 'Acme',
      status: 'APPROVED',
      isEmailVerified: true,
      companyId: acme.id,
    },
  })

  const managerTestCo = await prisma.user.create({
    data: {
      email: 'manager@testco.fr',
      passwordHash: await hash('password123'),
      role: 'MANAGER',
      firstName: 'Kilian',
      lastName: 'TestCo',
      status: 'APPROVED',
      isEmailVerified: true,
      companyId: testco.id,
    },
  })

  // ── Employés ──────────────────────────────────────────────
  const jean = await prisma.user.create({
    data: {
      email: 'jean.dupont@acme.fr',
      passwordHash: await hash('password123'),
      role: 'EMPLOYEE',
      firstName: 'Jean',
      lastName: 'Dupont',
      status: 'APPROVED',
      isEmailVerified: true,
      companyId: acme.id,
    },
  })

  const marie = await prisma.user.create({
    data: {
      email: 'marie.martin@acme.fr',
      passwordHash: await hash('password123'),
      role: 'EMPLOYEE',
      firstName: 'Marie',
      lastName: 'Martin',
      status: 'APPROVED',
      isEmailVerified: true,
      companyId: acme.id,
    },
  })

  // ── Attributions (débit pool Acme + crédit employé, invariant respecté) ──
  // jean +30, marie +50 → pool Acme : 500 - 80 = 420
  await prisma.$transaction([
    prisma.attribution.create({
      data: {
        amount: 30,
        reason: 'Excellent travail sur le projet client Q1',
        companyId: acme.id,
        managerId: bossAcme.id,
        employeeId: jean.id,
      },
    }),
    prisma.attribution.create({
      data: {
        amount: 50,
        reason: 'Dépassement des objectifs de vente',
        companyId: acme.id,
        managerId: bossAcme.id,
        employeeId: marie.id,
      },
    }),
    prisma.user.update({ where: { id: jean.id }, data: { balance: { increment: 30 } } }),
    prisma.user.update({ where: { id: marie.id }, data: { balance: { increment: 50 } } }),
    prisma.company.update({ where: { id: acme.id }, data: { tokenBalance: { decrement: 80 } } }),
  ])

  // ── Offres partenaires (category en enum OfferCategory) ───
  const amazon = await prisma.partnerOffer.create({
    data: { partnerName: 'Amazon', cost: 20, discountPercent: 50, category: 'SHOPPING', isActive: true },
  })

  const netflix = await prisma.partnerOffer.create({
    data: { partnerName: 'Netflix', cost: 15, discountPercent: 30, category: 'CULTURE', isActive: true },
  })

  // Offres supplémentaires pour étoffer la vitrine
  await prisma.partnerOffer.createMany({
    data: [
      { partnerName: 'Uber Eats', cost: 12, discountPercent: 25, category: 'FOOD', isActive: true },
      { partnerName: 'Spotify', cost: 10, discountPercent: 40, category: 'CULTURE', isActive: true },
      { partnerName: 'Decathlon', cost: 18, discountPercent: 20, category: 'WELLNESS', isActive: true },
      { partnerName: 'SNCF Connect', cost: 25, discountPercent: 15, category: 'TRAVEL', isActive: true },
    ],
  })

  // ── Codes promo ───────────────────────────────────────────
  await prisma.promoCode.createMany({
    data: [
      { code: 'AMAZON-SEED-001', offerId: amazon.id },
      { code: 'AMAZON-SEED-002', offerId: amazon.id },
      { code: 'NETFLIX-SEED-001', offerId: netflix.id },
    ],
  })

  console.log('✅ Seed terminé.')
  console.log('   Admin     : admin@primo.fr')
  console.log('   Companies : Acme (pool 420), TestCo (pool 200)')
  console.log('   Managers  : boss@acme.fr, test@testco.fr')
  console.log('   Employees : jean.dupont@acme.fr (30), marie.martin@acme.fr (50)')
  console.log('   Offers    : Amazon (SHOPPING), Netflix (CULTURE)')
  console.log('   Codes     : AMAZON-SEED-001, AMAZON-SEED-002, NETFLIX-SEED-001')
  console.log('   Password  : password123 (tous)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
