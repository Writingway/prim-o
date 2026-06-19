// Double solde manager (§3.3) + historiques envoyés/reçus.
// Contrats GELÉS recopiés depuis backend src/contracts/manager.contracts.ts.
// Endpoints addendum v1.1 pas encore livrés côté backend → bascule MOCK.
// Quand Dev B livre /api/managers/me/* : passer MANAGER_MOCKS à false.
import { authRequest, type ApiResult } from './client';

// ─── Types (miroir du contrat figé) ──────────────────────────────
export interface ManagerBalances {
  envelopeRemaining: number; // enveloppe à distribuer (registre Allocation/Attribution)
  personalBalance: number;   // solde perso reçu = rétribution cumulée
}

export interface ManagerSentRow {
  attributionId: string;
  employeeId: string;
  amount: number;
  motifTag: string;
  retributionAmount: number;
  createdAt: string; // ISO
}

export interface ManagerReceivedRow {
  amount: number;
  createdAt: string; // ISO
  sourceAllocationId: string | null;
}

export interface ManagerHistory {
  sent: ManagerSentRow[];
  received: ManagerReceivedRow[];
}

// ─── Bascule mock A/B ─────────────────────────────────────────────
// true tant que /api/managers/me/* n'existe pas. Flip → vrais endpoints.
//
// TECH DEBT (cutover §3.3) : à MANAGER_MOCKS=false, supprimer l'ancien
// solde unique de ManagerDashboard.tsx — getMyBalance import(12)/state(56)/
// call(95)/stat(327). personalBalance ici === user.balance là-bas. Vérifier
// la concordance à l'écran AVANT de supprimer (sinon régression : mock seul).
const MANAGER_MOCKS = true;

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, status: 200, data };
}

const MOCK_BALANCES: ManagerBalances = {
  envelopeRemaining: 320,
  personalBalance: 75,
};

const MOCK_HISTORY: ManagerHistory = {
  sent: [
    { attributionId: 'm-1', employeeId: 'emp-aya', amount: 50, motifTag: 'ENTRAIDE', retributionAmount: 5, createdAt: '2026-06-18T09:12:00.000Z' },
    { attributionId: 'm-2', employeeId: 'emp-leo', amount: 30, motifTag: 'CLIENT_SATISFAIT', retributionAmount: 3, createdAt: '2026-06-17T15:40:00.000Z' },
    { attributionId: 'm-3', employeeId: 'emp-noa', amount: 20, motifTag: 'INITIATIVE', retributionAmount: 0, createdAt: '2026-06-16T11:05:00.000Z' },
  ],
  received: [
    { amount: 60, createdAt: '2026-06-15T08:00:00.000Z', sourceAllocationId: 'alloc-1' },
    { amount: 15, createdAt: '2026-06-10T08:00:00.000Z', sourceAllocationId: 'alloc-2' },
  ],
};

// GET /api/managers/me/balances → 2 panneaux de solde.
export function getManagerBalances(): Promise<ApiResult<ManagerBalances>> {
  if (MANAGER_MOCKS) return Promise.resolve(ok(MOCK_BALANCES));
  return authRequest<ManagerBalances>('GET', '/managers/me/balances');
}

// GET /api/managers/me/history → 2 historiques (envoyés / reçus).
export function getManagerHistory(): Promise<ApiResult<ManagerHistory>> {
  if (MANAGER_MOCKS) return Promise.resolve(ok(MOCK_HISTORY));
  return authRequest<ManagerHistory>('GET', '/managers/me/history');
}
