/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `CompanyTokenPurchase` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CompanyTokenPurchase" ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTokenPurchase_stripeSessionId_key" ON "CompanyTokenPurchase"("stripeSessionId");
