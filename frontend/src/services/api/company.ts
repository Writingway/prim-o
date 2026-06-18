import { Company, AttributionHistory } from "../../types/types";
import { authRequest } from "./client";

// Solde du pool de tokens de l'entreprise du manager.
export const getCompany = () =>
  authRequest<{ company: Company }>('GET', '/company');

// Historique des attributions de l'entreprise (récentes d'abord).
export const listAttributions = () =>
  authRequest<{ attributions: AttributionHistory[] }>('GET', '/attributions');

// Génère un code d'invitation (manager connecté).
// Aucun body : le code est créé côté serveur avec les défauts backend.
export const generateInviteCode = (role: 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE') =>
  authRequest<{ invite: { code: string; maxUses: number; expiresAt: string; createdAt: string } }>(
    'POST',
    '/invites/generate',
    { role },
  );

// Attribue des tokens à un employé (manager connecté).
// Le backend débite le pool entreprise et crédite l'employé de façon atomique.
export const createAttribution = (payload: { employeeId: string; amount: number; reason: string }) =>
  authRequest<
    { attribution: { id: string; amount: number; reason: string; createdAt: string } } | { error: string }
  >('POST', '/attributions', payload);
