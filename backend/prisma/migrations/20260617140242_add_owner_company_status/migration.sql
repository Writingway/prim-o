-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "CompanyInviteCode" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EMPLOYEE';

-- UpdateData
UPDATE "Company" SET "status" = 'APPROVED';