/*
  Warnings:

  - You are about to drop the column `category` on the `PartnerOffer` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `PartnerOffer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PartnerOffer" DROP CONSTRAINT "PartnerOffer_categoryId_fkey";

-- DropIndex
DROP INDEX "PartnerOffer_category_idx";

-- AlterTable
ALTER TABLE "PartnerOffer" DROP COLUMN "category",
ALTER COLUMN "categoryId" SET NOT NULL;

-- DropEnum
DROP TYPE "OfferCategory";

-- AddForeignKey
ALTER TABLE "PartnerOffer" ADD CONSTRAINT "PartnerOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
