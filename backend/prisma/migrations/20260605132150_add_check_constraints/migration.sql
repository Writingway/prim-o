-- Règle métier : aucun solde ne peut être négatif (filet de sécurité DB)
ALTER TABLE "User"                 ADD CONSTRAINT user_balance_non_negative   CHECK ("balance" >= 0);
ALTER TABLE "Company"              ADD CONSTRAINT company_pool_non_negative    CHECK ("tokenBalance" >= 0);

-- Règle métier : les montants de tokens sont strictement positifs
ALTER TABLE "Attribution"          ADD CONSTRAINT attribution_amount_positive  CHECK ("amount" > 0);
ALTER TABLE "Redemption"           ADD CONSTRAINT redemption_amount_positive   CHECK ("amount" > 0);
ALTER TABLE "CompanyTokenPurchase" ADD CONSTRAINT purchase_amount_positive     CHECK ("amount" > 0);

-- Unicité de l'email uniquement parmi les comptes non supprimés (réinscription possible après soft-delete)
CREATE UNIQUE INDEX user_email_active_unique ON "User" ("email") WHERE "deletedAt" IS NULL;
