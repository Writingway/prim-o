-- Migration initiale consolidée — schema final Prim'O
-- Contient tous les renommages et corrections appliqués manuellement.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateTable Admin
CREATE TABLE "Admin" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "email"        TEXT         NOT NULL,
    "passwordHash" TEXT         NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable Manager
CREATE TABLE "Manager" (
    "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
    "companyName"     TEXT         NOT NULL,
    "email"           TEXT         NOT NULL,
    "passwordHash"    TEXT         NOT NULL,
    "balance"         INTEGER      NOT NULL DEFAULT 0,
    "isEmailVerified" BOOLEAN      NOT NULL DEFAULT false,
    "isSmsVerified"   BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    "deletedAt"       TIMESTAMP(3),
    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable Employee
CREATE TABLE "Employee" (
    "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
    "firstName"       TEXT         NOT NULL,
    "lastName"        TEXT         NOT NULL,
    "email"           TEXT         NOT NULL,
    "passwordHash"    TEXT         NOT NULL,
    "balance"         INTEGER      NOT NULL DEFAULT 0,
    "isEmailVerified" BOOLEAN      NOT NULL DEFAULT false,
    "isSmsVerified"   BOOLEAN      NOT NULL DEFAULT false,
    "invitationCode"  TEXT,
    "managerId"       UUID         NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    "deletedAt"       TIMESTAMP(3),
    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable RefreshToken
CREATE TABLE "RefreshToken" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash"    TEXT         NOT NULL,
    "role"         "Role"       NOT NULL,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "isRevoked"    BOOLEAN      NOT NULL DEFAULT false,
    "replacedById" UUID,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "managerId"    UUID,
    "employeeId"   UUID,
    "adminId"      UUID,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable Attribution  (employeur → employé : attribution de tokens)
CREATE TABLE "Attribution" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "amount"     INTEGER      NOT NULL,
    "reason"     TEXT         NOT NULL,
    "managerId"  UUID         NOT NULL,
    "employeeId" UUID         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable PartnerOffer
CREATE TABLE "PartnerOffer" (
    "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
    "partnerName" TEXT          NOT NULL,
    "cost"        INTEGER       NOT NULL,
    "valueEuros"  DECIMAL(10,2) NOT NULL,
    "category"    TEXT          NOT NULL,
    "isActive"    BOOLEAN       NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "PartnerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable PromoCode
CREATE TABLE "PromoCode" (
    "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "code"      TEXT         NOT NULL,
    "isUsed"    BOOLEAN      NOT NULL DEFAULT false,
    "usedAt"    TIMESTAMP(3),
    "offerId"   UUID         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable Redemption  (employé échange des tokens contre un code promo)
CREATE TABLE "Redemption" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "amount"      INTEGER      NOT NULL,
    "employeeId"  UUID         NOT NULL,
    "promoCodeId" UUID         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key"             ON "Admin"("email");
CREATE UNIQUE INDEX "Manager_email_key"           ON "Manager"("email");
CREATE UNIQUE INDEX "Employee_email_key"          ON "Employee"("email");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key"  ON "RefreshToken"("tokenHash");
CREATE UNIQUE INDEX "PromoCode_code_key"          ON "PromoCode"("code");
CREATE UNIQUE INDEX "Redemption_promoCodeId_key"  ON "Redemption"("promoCodeId");

-- AddForeignKey
ALTER TABLE "Employee"
  ADD CONSTRAINT "Employee_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Attribution"
  ADD CONSTRAINT "Attribution_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attribution"
  ADD CONSTRAINT "Attribution_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PromoCode"
  ADD CONSTRAINT "PromoCode_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "PartnerOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Redemption"
  ADD CONSTRAINT "Redemption_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Redemption"
  ADD CONSTRAINT "Redemption_promoCodeId_fkey"
  FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
