-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('A_DISTRIBUER', 'DISTRIBUEE');

-- AlterTable
ALTER TABLE "Allocation" ADD COLUMN     "distributedAt" TIMESTAMP(3),
ADD COLUMN     "retributionAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "AllocationStatus" NOT NULL DEFAULT 'A_DISTRIBUER';

-- AlterTable
ALTER TABLE "Attribution" ADD COLUMN     "allocationId" UUID;

-- CreateIndex
CREATE INDEX "Attribution_allocationId_idx" ON "Attribution"("allocationId");

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
