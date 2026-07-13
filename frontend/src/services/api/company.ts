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

// Token pool balance of the manager's company.
export const getCompany = () =>
  authRequest<{ company: Company }>('GET', '/company');

// The company's attribution history (most recent first).
export const listAttributions = () =>
  authRequest<{ attributions: AttributionHistory[] }>('GET', '/attributions');

// Generates an invite code (logged-in manager). Only the target role is sent; the code itself
// is created server-side with the backend defaults (maxUses, expiry).
export const generateInviteCode = (role: 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE') =>
  authRequest<{ invite: { code: string; maxUses: number; expiresAt: string; createdAt: string } }>(
    'POST',
    '/invites/generate',
    { role },
  );

// Direct employer → employee grant (TPE, very small companies): amount + mandatory motif
// (allocation reason), no mode. The backend debits the company pool and credits the employee
// atomically.
export const createAttribution = (payload: { employeeId: string; amount: number; motifId: string }) =>
  authRequest<
    { attribution: { id: string; amount: number; createdAt: string } } | { error: string }
  >('POST', '/attributions', payload);

// A manager of the company (for the owner-side allocation screen).
export type CompanyManager = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  balance: number;
};

// Lists the company's managers (owner only).
export const listManagers = () =>
  authRequest<{ managers: CompanyManager[] }>('GET', '/attributions/managers');

// Owner → manager allocation: creates an envelope (debits the pool). The mode decides the
// manager's retribution; percentage is required ONLY in POURCENTAGE mode.
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

// Active official motifs, grouped by category (feeds the motif picker).
export const listMotifs = () =>
  authRequest<{ categories: MotifCategoryGroup[] }>('GET', '/motifs');

// The current manager's envelopes (the "Mes enveloppes reçues" screen).
export const listEnvelopes = () =>
  authRequest<{ envelopes: ManagerEnvelope[] }>('GET', '/attributions/envelopes');

// Envelopes sent by the current employer (the "Mes enveloppes envoyées" screen).
export const listSentEnvelopes = () =>
  authRequest<{ envelopes: SentEnvelope[] }>('GET', '/attributions/sent-envelopes');

// The manager's two balances: remaining envelope budget + personal balance (retribution).
export const getManagerBalances = () =>
  authRequest<ManagerBalances>('GET', '/attributions/balances');

// Atomic redistribution of an envelope (a single call covers the manager's share + the
// employee lines).
export const distributeEnvelope = (payload: { allocationId: string; lines: DistributeLine[] }) =>
  authRequest<
    | { allocationId: string; retributionAmount: number; distributed: number; lineCount: number; status: string }
    | { error: string }
  >('POST', '/attributions/distribute', payload);
