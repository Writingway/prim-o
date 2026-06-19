-- AlterTable
ALTER TABLE "User" DROP COLUMN "status",
ALTER COLUMN "role" DROP NOT NULL;

-- DropEnum
DROP TYPE "UserStatus";
