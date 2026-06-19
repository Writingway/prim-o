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
  await prisma.allocation.deleteMany()
  await prisma.motif.deleteMany()
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
      isEmailVerified: true,
      companyId: acme.id,
    },
  })

  // ── Motifs officiels v1.1 (§3.5) : 13 motifs, 4 catégories ──
  // Liste figée gérée par l'ADMIN (custom employeur = V2). tag = clé stats stable.
  await prisma.motif.createMany({
    data: [
      // Comportements individuels
      { tag: 'PONCTUALITE_PRESENCE', label: 'Ponctualité & présence', category: 'COMPORTEMENTS_INDIVIDUELS', compliment: "Toujours là, toujours à l'heure", sortOrder: 1 },
      { tag: 'PRISE_INITIATIVE', label: "Prise d'initiative", category: 'COMPORTEMENTS_INDIVIDUELS', compliment: "Tu n'as pas attendu qu'on te le demande", sortOrder: 2 },
      { tag: 'QUALITE_EXECUTION', label: "Qualité d'exécution", category: 'COMPORTEMENTS_INDIVIDUELS', compliment: "C'est fait, et c'est bien fait", sortOrder: 3 },
      { tag: 'AUTONOMIE', label: 'Autonomie', category: 'COMPORTEMENTS_INDIVIDUELS', compliment: 'Tu gères, et ça se voit', sortOrder: 4 },
      // Relation client
      { tag: 'ATTITUDE_ACCUEIL_CLIENT', label: 'Attitude & accueil client', category: 'RELATION_CLIENT', compliment: "Tu as mis le client à l'aise dès le premier regard", sortOrder: 5 },
      { tag: 'GESTION_SITUATION_DIFFICILE', label: 'Gestion situation difficile', category: 'RELATION_CLIENT', compliment: 'Tu as géré avec calme et professionnalisme', sortOrder: 6 },
      { tag: 'FIDELISATION_CLIENT', label: 'Fidélisation client', category: 'RELATION_CLIENT', compliment: 'Ce client reviendra grâce à toi', sortOrder: 7 },
      { tag: 'VENTE_ADDITIONNELLE', label: 'Vente additionnelle', category: 'RELATION_CLIENT', compliment: 'Tu as su proposer au bon moment', sortOrder: 8 },
      // Esprit collectif
      { tag: 'ENTRAIDE_COOPERATION', label: 'Entraide & coopération', category: 'ESPRIT_COLLECTIF', compliment: "Tu as tiré l'équipe vers le haut", sortOrder: 9 },
      { tag: 'TRANSMISSION_COMPETENCES', label: 'Transmission de compétences', category: 'ESPRIT_COLLECTIF', compliment: "Tu as pris le temps d'expliquer - c'est rare", sortOrder: 10 },
      { tag: 'POLYVALENCE_ACCEPTEE', label: 'Polyvalence acceptée', category: 'ESPRIT_COLLECTIF', compliment: "Tu as dit oui quand on avait besoin", sortOrder: 11 },
      // Engagement
      { tag: 'PRESENCE_SITUATION_TENDUE', label: 'Présence en situation tendue', category: 'ENGAGEMENT', compliment: "Tu étais là quand c'était difficile", sortOrder: 12 },
      { tag: 'RESPECT_PROCESS_HYGIENE', label: 'Respect des process & hygiène', category: 'ENGAGEMENT', compliment: 'Rien ne traîne, tout est carré', sortOrder: 13 },
    ],
  })
  const motifQualite = await prisma.motif.findUniqueOrThrow({ where: { tag: 'QUALITE_EXECUTION' } })
  const motifVente = await prisma.motif.findUniqueOrThrow({ where: { tag: 'VENTE_ADDITIONNELLE' } })

  // ── Attributions (débit pool Acme + crédit employé, invariant respecté) ──
  // jean +30, marie +50 → pool Acme : 500 - 80 = 420
  await prisma.$transaction([
    prisma.attribution.create({
      data: {
        amount: 30,
        reason: 'Excellent travail sur le projet client Q1',
        motifId: motifQualite.id,
        companyId: acme.id,
        managerId: bossAcme.id,
        employeeId: jean.id,
      },
    }),
    prisma.attribution.create({
      data: {
        amount: 50,
        reason: 'Dépassement des objectifs de vente',
        motifId: motifVente.id,
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
