import { Company, AttributionHistory } from "../../types/types";
import type {
  RetributionMode,
  MotifCategoryGroup,
  ManagerEnvelope,
  ManagerBalances,
  DistributeLine,
  SentEnvelope,
} from "../../types/types";
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

// Envoi direct employeur → employé (TPE) : montant + motif obligatoire, sans mode.
// Le backend débite le pool entreprise et crédite l'employé de façon atomique.
export const createAttribution = (payload: { employeeId: string; amount: number; motifId: string; reason?: string }) =>
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

// Allocation patron → manager : crée une enveloppe (débite le pool). Le mode décide
// de la rétribution du manager ; percentage requis UNIQUEMENT en mode POURCENTAGE.
export const allocateTokens = (
  managerId: string,
  amount: number,
  mode: RetributionMode,
  percentage?: number,
) =>
  authRequest<
    | { allocationId: string; status: string; mode: RetributionMode; percentage: number | null; companyTokenBalance: number }
    | { error: string }
  >('POST', '/attributions/allocate', {
    managerId,
    amount,
    mode,
    ...(mode === 'POURCENTAGE' ? { percentage } : {}),
  });

// Motifs officiels actifs, groupés par catégorie (alimente le sélecteur de motif).
export const listMotifs = () =>
  authRequest<{ categories: MotifCategoryGroup[] }>('GET', '/motifs');

// Enveloppes du manager courant ("Mes enveloppes reçues").
export const listEnvelopes = () =>
  authRequest<{ envelopes: ManagerEnvelope[] }>('GET', '/attributions/envelopes');

// Enveloppes envoyées par l'employeur courant ("Mes enveloppes envoyées").
export const listSentEnvelopes = () =>
  authRequest<{ envelopes: SentEnvelope[] }>('GET', '/attributions/sent-envelopes');

// Doubles soldes manager : budget d'enveloppes restant + solde perso (rétribution).
export const getManagerBalances = () =>
  authRequest<ManagerBalances>('GET', '/attributions/balances');

// Redistribution atomique d'une enveloppe (un seul envoi : part manager + employés).
export const distributeEnvelope = (payload: { allocationId: string; lines: DistributeLine[] }) =>
  authRequest<
    | { allocationId: string; retributionAmount: number; distributed: number; lineCount: number; status: string }
    | { error: string }
  >('POST', '/attributions/distribute', payload);
