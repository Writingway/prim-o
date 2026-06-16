// Barrel : conserve l'import public `from "../types/types"`.
// Les types sont découpés par domaine (shared/offer/employee/company/admin) ;
// ce fichier ne fait que les ré-exporter — aucun composant ne change.

export * from './shared';
export * from './offer';
export * from './employee';
export * from './company';
export * from './admin';
