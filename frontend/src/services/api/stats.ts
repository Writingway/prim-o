import { authRequest } from "./client";
import type { MotifCategory } from "../../types/allocation";
export type { MotifCategory };

// Mirrors the backend shapes (§3.2/§3.4) - see manager.contracts.ts.
export type MotifAggregateRow = {
  motifTag: string;
  category: MotifCategory;
  count: number;
  totalTokens: number;
};

export type EmployeeRankingRow = {
  employeeId: string;
  totalTokens: number;
  topMotifTag: string | null;
};

export type MotifLeaderboardRow = {
  motifTag: string;
  category: MotifCategory;
  top: Array<{ employeeId: string; tokens: number; count: number }>;
};

export type ManagerBlindSpotsRow = { managerId: string; tags: string[] };
export type EvolutionPoint = { period: string; motifTag: string; count: number; totalTokens: number };
export type EquityRow = {
  managerId: string;
  spread: number;
  recipients: Array<{ employeeId: string; tokens: number; share: number }>;
};

export type StatsResponse = {
  motifAggregate: MotifAggregateRow[];
  ranking: EmployeeRankingRow[];
  blindSpots: string[];
  blindSpotsByManager: ManagerBlindSpotsRow[];
  equityByManager: EquityRow[];
  velocityByManager: Array<{ managerId: string; avgDelaySeconds: number | null }>;
  managerNames: Record<string, string>;
  leaderboardByMotif: MotifLeaderboardRow[];
  evolution: EvolutionPoint[];
};

// Employer statistics dashboard (OWNER only). from/to bound the attribution date;
// employeeId scopes the evolution curve to a single employee.
export const getStats = (params?: { from?: string; to?: string; employeeId?: string }) => {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.employeeId) qs.set('employeeId', params.employeeId);
  const q = qs.toString();
  return authRequest<StatsResponse>('GET', `/stats${q ? `?${q}` : ''}`);
};
