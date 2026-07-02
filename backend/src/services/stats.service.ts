import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import type {
  StatsResponse,
  MotifAggregateRow,
  EmployeeRankingRow,
  MotifLeaderboardRow,
  EvolutionPoint,
} from '../contracts/manager.contracts';

interface StatsFilters {
  from?: Date | undefined;
  to?: Date | undefined;
  employeeId?: string | undefined; // Scopes the evolution curve only, not the other stats.
}

// §3.2/§3.4 — employer dashboard. Everything is scoped to companyId (multi-tenant).
// At most 2 queries per stat, zero N+1.
export async function getStats(companyId: string, filters: StatsFilters): Promise<StatsResponse> {
  const createdAt =
    filters.from || filters.to
      ? {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to ? { lte: filters.to } : {}),
        }
      : undefined;

  const whereAttr = { companyId, ...(createdAt ? { createdAt } : {}) };

  // Active motif catalog — shared by motifAggregate AND blindSpots (one query).
  const activeMotifs = await prisma.motif.findMany({
    where: { active: true },
    select: { id: true, tag: true, category: true, sortOrder: true },
  });
  const motifById = new Map(activeMotifs.map((m) => [m.id, m]));

  // 1) motifAggregate — count and token sum per motif.
  const aggRows = await prisma.attribution.groupBy({
    by: ['motifId'],
    where: { ...whereAttr, motifId: { not: null } },
    _count: { _all: true },
    _sum: { amount: true },
  });

  const usedMotifIds = new Set<string>();
  const motifAggregate: MotifAggregateRow[] = [];
  for (const row of aggRows) {
    if (!row.motifId) continue;
    const motif = motifById.get(row.motifId);
    if (!motif) continue; // Inactive/deleted motif: outside the official catalog.
    usedMotifIds.add(row.motifId);
    motifAggregate.push({
      motifTag: motif.tag,
      category: motif.category,
      count: row._count._all,
      totalTokens: row._sum.amount ?? 0,
    });
  }
  // Motifs that received the most tokens come first.
  motifAggregate.sort((a, b) => b.totalTokens - a.totalTokens || b.count - a.count);

  // 2) ranking — total per employee plus the motif they received most often.
  const totalsByEmployee = await prisma.attribution.groupBy({
    by: ['employeeId'],
    where: whereAttr,
    _sum: { amount: true },
  });

  const motifByEmployee = await prisma.attribution.groupBy({
    by: ['employeeId', 'motifId'],
    where: { ...whereAttr, motifId: { not: null } },
    _count: { _all: true },
    _sum: { amount: true },
  });

  // employeeId -> motif with the highest count (tie-break: first seen; groupBy order is stable).
  const topMotif = new Map<string, { motifId: string; count: number }>();
  for (const row of motifByEmployee) {
    if (!row.motifId) continue;
    const current = topMotif.get(row.employeeId);
    if (!current || row._count._all > current.count) {
      topMotif.set(row.employeeId, { motifId: row.motifId, count: row._count._all });
    }
  }

  const ranking: EmployeeRankingRow[] = totalsByEmployee
    .map((row) => {
      const top = topMotif.get(row.employeeId);
      const topMotifTag = top ? motifById.get(top.motifId)?.tag ?? null : null;
      return { employeeId: row.employeeId, totalTokens: row._sum.amount ?? 0, topMotifTag };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens); // The client expects the top earner first.

  // 3) blindSpots — active motifs never used in the company-wide scope.
  const blindSpots = activeMotifs.filter((m) => !usedMotifIds.has(m.id)).map((m) => m.tag);

  // 3bis) blindSpotsByManager — active motifs EACH manager has never used (§3.5).
  const usedByManagerRows = await prisma.attribution.groupBy({
    by: ['managerId', 'motifId'],
    where: { ...whereAttr, motifId: { not: null } },
    _count: { _all: true },
  });
  const usedByManager = new Map<string, Set<string>>();
  for (const row of usedByManagerRows) {
    if (!row.motifId) continue;
    const set = usedByManager.get(row.managerId) ?? new Set<string>();
    set.add(row.motifId);
    usedByManager.set(row.managerId, set);
  }
  const blindSpotsByManagerRaw = Array.from(usedByManager.entries()).map(([managerId, used]) => ({
    managerId,
    tags: activeMotifs.filter((m) => !used.has(m.id)).map((m) => m.tag),
  }));

  // 4) equityByManager — coefficient of variation of per-employee totals, per manager
  // (does this manager always favor the same people?).
  const perManagerEmployee = await prisma.attribution.groupBy({
    by: ['managerId', 'employeeId'],
    where: whereAttr,
    _sum: { amount: true },
  });

  const recByManager = new Map<string, Array<{ employeeId: string; tokens: number }>>();
  for (const row of perManagerEmployee) {
    const arr = recByManager.get(row.managerId) ?? [];
    arr.push({ employeeId: row.employeeId, tokens: row._sum.amount ?? 0 });
    recByManager.set(row.managerId, arr);
  }

  const equityByManagerRaw = Array.from(recByManager.entries()).map(([managerId, recs]) => {
    const totals = recs.map((r) => r.tokens);
    const n = totals.length;
    const sumAll = totals.reduce((s, v) => s + v, 0);
    const mean = sumAll / n;
    const variance = totals.reduce((s, v) => s + (v - mean) ** 2, 0) / n; // Population variance.
    const spread = mean > 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation; 0 = perfectly even.
    const recipients = recs
      .map((r) => ({ employeeId: r.employeeId, tokens: r.tokens, share: sumAll > 0 ? r.tokens / sumAll : 0 }))
      .sort((a, b) => b.tokens - a.tokens); // Whom the manager favors most, first.
    return { managerId, spread, recipients };
  });

  // 5) velocityByManager — average delay from allocation to the first distribution after it.
  const velocityByManager = await getVelocityByManager(companyId, filters.to);

  // 5bis) Resolve the distributors present in the aggregates. The OWNER only distributes to
  // managers (allocations), so non-MANAGER roles are excluded here: the "per manager"
  // sections must show real managers only (deleted ones included). Names are resolved
  // WITHOUT filtering deletedAt — otherwise the frontend falls back to a truncated UUID.
  const distributorIds = new Set<string>([
    ...blindSpotsByManagerRaw.map((r) => r.managerId),
    ...equityByManagerRaw.map((r) => r.managerId),
    ...velocityByManager.map((r) => r.managerId),
  ]);
  const distributorUsers = distributorIds.size
    ? await prisma.user.findMany({
        where: { id: { in: [...distributorIds] } },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      })
    : [];
  const isManager = new Set(distributorUsers.filter((u) => u.role === 'MANAGER').map((u) => u.id));
  const managerNames: Record<string, string> = {};
  for (const u of distributorUsers) {
    if (!isManager.has(u.id)) continue; // The owner is excluded from the per-manager display.
    managerNames[u.id] = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
  }
  // Keep only real managers in the attribution-based aggregates (velocity comes from
  // allocations, which already involve managers only).
  const blindSpotsByManager = blindSpotsByManagerRaw.filter((r) => isManager.has(r.managerId));
  const equityByManager = equityByManagerRaw.filter((r) => isManager.has(r.managerId));

  // 6) leaderboardByMotif (contract bump v1.2) — top 3 employees per motif ("who is best at
  // what"), OWNER only. Reuses motifByEmployee (already loaded for topMotifTag): no extra query.
  const TOP_N = 3;
  const byMotif = new Map<string, Array<{ employeeId: string; tokens: number; count: number }>>();
  for (const row of motifByEmployee) {
    if (!row.motifId) continue;
    const arr = byMotif.get(row.motifId) ?? [];
    arr.push({ employeeId: row.employeeId, tokens: row._sum.amount ?? 0, count: row._count._all });
    byMotif.set(row.motifId, arr);
  }
  const leaderboardRows: Array<{ sortOrder: number; row: MotifLeaderboardRow }> = [];
  for (const [motifId, entries] of byMotif.entries()) {
    const motif = motifById.get(motifId);
    if (!motif) continue;
    const top = entries
      .sort((a, b) => b.tokens - a.tokens || b.count - a.count || a.employeeId.localeCompare(b.employeeId))
      .slice(0, TOP_N);
    leaderboardRows.push({
      sortOrder: motif.sortOrder,
      row: { motifTag: motif.tag, category: motif.category, top },
    });
  }
  const leaderboardByMotif: MotifLeaderboardRow[] = leaderboardRows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((x) => x.row);

  // 7) evolution — monthly curve per motif (optionally scoped to a single employee).
  const evolution = await getEvolution(companyId, filters, motifById);

  return {
    motifAggregate,
    ranking,
    blindSpots,
    blindSpotsByManager,
    equityByManager,
    velocityByManager,
    managerNames,
    leaderboardByMotif,
    evolution,
  };
}

// §3.5 — aggregates tagged attributions by month × motif; date_trunc('month') is rendered
// as 'YYYY-MM' via to_char. Optional employeeId yields one employee's progression curve.
async function getEvolution(
  companyId: string,
  filters: StatsFilters,
  motifById: Map<string, { tag: string }>,
): Promise<EvolutionPoint[]> {
  const conds: Prisma.Sql[] = [
    Prisma.sql`a."companyId" = ${companyId}::uuid`,
    Prisma.sql`a."motifId" IS NOT NULL`,
  ];
  if (filters.employeeId) conds.push(Prisma.sql`a."employeeId" = ${filters.employeeId}::uuid`);
  if (filters.from) conds.push(Prisma.sql`a."createdAt" >= ${filters.from}`);
  if (filters.to) conds.push(Prisma.sql`a."createdAt" <= ${filters.to}`);

  const rows = await prisma.$queryRaw<Array<{ period: string; motifId: string; count: number; totalTokens: number }>>(
    Prisma.sql`
      SELECT to_char(date_trunc('month', a."createdAt"), 'YYYY-MM') AS period,
             a."motifId" AS "motifId",
             COUNT(*)::int AS count,
             COALESCE(SUM(a."amount"), 0)::int AS "totalTokens"
      FROM "Attribution" a
      WHERE ${Prisma.join(conds, ' AND ')}
      GROUP BY 1, 2
      ORDER BY 1
    `,
  );

  const out: EvolutionPoint[] = [];
  for (const r of rows) {
    const tag = motifById.get(r.motifId)?.tag;
    if (!tag) continue; // Inactive/deleted motif: outside the official catalog.
    out.push({ period: r.period, motifTag: tag, count: r.count, totalTokens: r.totalTokens });
  }
  return out;
}

// §3.4 — for each Allocation, the same manager's first Attribution after it; averaged per
// manager. The LATERAL join avoids N+1. AVG ignores NULLs, so the result is null only when
// NO allocation was ever followed by a distribution.
async function getVelocityByManager(
  companyId: string,
  to?: Date,
): Promise<Array<{ managerId: string; avgDelaySeconds: number | null }>> {
  const toFilter = to ? Prisma.sql`AND att."createdAt" <= ${to}` : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ managerId: string; avgDelaySeconds: number | null }>>(
    Prisma.sql`
      SELECT a."managerId" AS "managerId",
             AVG(EXTRACT(EPOCH FROM (first.first_at - a."createdAt")))::float8 AS "avgDelaySeconds"
      FROM "Allocation" a
      LEFT JOIN LATERAL (
        SELECT MIN(att."createdAt") AS first_at
        FROM "Attribution" att
        WHERE att."managerId" = a."managerId"
          AND att."companyId" = a."companyId"
          AND att."createdAt" > a."createdAt"
          ${toFilter}
      ) first ON true
      WHERE a."companyId" = ${companyId}::uuid
      GROUP BY a."managerId"
    `,
  );

  return rows.map((r) => ({
    managerId: r.managerId,
    avgDelaySeconds: r.avgDelaySeconds == null ? null : Math.round(r.avgDelaySeconds),
  }));
}
