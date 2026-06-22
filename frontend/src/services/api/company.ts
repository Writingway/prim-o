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
// motifId est OBLIGATOIRE (§3.5) ; reason = note libre optionnelle.
export const createAttribution = (payload: {
  employeeId: string;
  amount: number;
  motifId: string;
  reason?: string;
}) =>
  authRequest<
    { attribution: { id: string; amount: number; reason: string; createdAt: string } } | { error: string }
  >('POST', '/attributions', payload);

// Un manager de l'entreprise (pour l'allocation côté patron).
export type CompanyManager = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  balance: number;
};

// Liste les managers de l'entreprise (patron).
export const listManagers = () =>
  authRequest<{ managers: CompanyManager[] }>('GET', '/attributions/managers');

// Solde perso de l'utilisateur courant (manager : tokens alloués par le patron).
export const getMyBalance = () =>
  authRequest<{ balance: number }>('GET', '/attributions/my-balance');

// Allocation patron → manager (débite le pool, crédite le solde du manager).
export const allocateTokens = (managerId: string, amount: number) =>
  authRequest<
    { manager: { id: string; firstName: string | null; lastName: string | null; balance: number } } | { error: string }
  >('POST', '/attributions/allocate', { managerId, amount });
