-- CreateEnum
CREATE TYPE "MotifCategory" AS ENUM ('COMPORTEMENTS_INDIVIDUELS', 'RELATION_CLIENT', 'ESPRIT_COLLECTIF', 'ENGAGEMENT');

-- CreateEnum
CREATE TYPE "RetributionMode" AS ENUM ('PART_EGALE', 'POURCENTAGE', 'AUCUNE');

-- AlterTable
ALTER TABLE "Attribution" ADD COLUMN     "motifId" UUID,
ADD COLUMN     "retributionAmount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Motif" (
    "id" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "MotifCategory" NOT NULL,
    "compliment" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Motif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "mode" "RetributionMode" NOT NULL,
    "percentage" INTEGER,
    "companyId" UUID NOT NULL,
    "managerId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Motif_tag_key" ON "Motif"("tag");

-- CreateIndex
CREATE INDEX "Allocation_companyId_idx" ON "Allocation"("companyId");

-- CreateIndex
CREATE INDEX "Allocation_managerId_idx" ON "Allocation"("managerId");

-- CreateIndex
CREATE INDEX "Attribution_motifId_idx" ON "Attribution"("motifId");

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_motifId_fkey" FOREIGN KEY ("motifId") REFERENCES "Motif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
