-- Suppression de la colonne legacy `reason` (remplacée par motifId).
ALTER TABLE "Attribution" DROP COLUMN "reason";
