import { useEffect, useState } from 'react';
import {
  getStats,
  listEmployees,
  listManagers,
  listMotifs,
  type StatsResponse,
  type CompanyManager,
  type MotifCategory,
  type EvolutionPoint,
} from '../services/api';
import type { Employee } from '../types/types';
import Layout from '../components/layout/Layout';
import Icon from '../components/ui/Icon';
import BottomNav from '../components/layout/BottomNav';
import { NAV_ITEMS } from '../hooks/useBottomNav';

type StatsPageProps = {
  onLogout: () => void;
  onBack: () => void;
  onNavTab?: (tab: string) => void;
};

const CATEGORY_LABELS: Record<MotifCategory, string> = {
  COMPORTEMENTS_INDIVIDUELS: 'Comportements individuels',
  RELATION_CLIENT: 'Relation client',
  ESPRIT_COLLECTIF: 'Esprit collectif',
  ENGAGEMENT: 'Engagement',
};

// Délai en secondes → format lisible court. null = pas de distribution.
const formatDelay = (s: number | null): string => {
  if (s == null) return '—';
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(s / 3600);
  if (h < 48) return `${h} h`;
  return `${Math.round(s / 86400)} j`;
};

// Rang affiché dans une pastille (le top-3 n'a plus d'emoji médaille).
const medal = (i: number) => `${i + 1}`;

// Palette multi-séries alignée sur la charte (teal d'abord, puis catégories).
const PALETTE = ['#00a19a', '#e08c12', '#7c5cd0', '#3f7fcb', '#0e9f6e', '#d24e86', '#2e84c8', '#e5784a'];

// Classes Tailwind (ancien StatsPage.css). Variantes descendantes [&_x]: pour les enfants.
const DIVIDER = 'border-b border-[#f0f3f2] last:border-b-0';
const C = {
  wrapper: 'flex justify-center bg-primo-surface px-4 pb-16 pt-5',
  container: 'flex w-full max-w-[920px] flex-col gap-5',
  filters:
    'flex flex-wrap items-center gap-3 rounded-2xl border border-primo-line bg-white px-4 py-3.5 ' +
    '[&_label]:flex [&_label]:items-center [&_label]:gap-1.5 [&_label]:text-[0.85rem] [&_label]:text-primo-slate-soft ' +
    '[&_input]:rounded-[11px] [&_input]:border-[1.5px] [&_input]:border-primo-line [&_input]:px-2.5 [&_input]:py-2 [&_input]:text-primo-ink ' +
    '[&_input:focus]:border-primo-teal [&_input:focus]:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] [&_input:focus]:outline-none',
  section: 'rounded-[18px] border border-primo-line bg-white p-5',
  title:
    'mb-3.5 flex items-center gap-2 text-[1.05rem] font-extrabold tracking-[-0.01em] text-primo-ink ' +
    '[&_small]:text-[0.78rem] [&_small]:font-medium [&_small]:text-primo-muted',
  hint: '-mt-1.5 mb-3.5 text-[0.8rem] leading-[1.45] text-primo-muted [&_strong]:font-semibold [&_strong]:text-primo-slate',
  list: 'm-0 list-none p-0',
  // Top par motif
  leadGrid: 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4',
  leadCard: 'rounded-[14px] border border-primo-line bg-primo-surface p-3.5',
  leadCat: 'text-[0.7rem] uppercase tracking-[0.04em] text-primo-muted',
  leadMotif: 'mb-2.5 mt-0.5 font-bold text-primo-ink',
  leadRow: 'flex items-center gap-2 py-1',
  leadRank:
    'flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primo-mint text-[0.75rem] font-extrabold text-primo-teal-strong',
  leadName: 'flex-1 text-[0.9rem] text-primo-slate',
  leadTokens: 'text-[0.85rem] font-extrabold text-primo-teal-strong',
  // Classement
  rankRow: `flex items-center gap-2.5 px-1 py-2 ${DIVIDER}`,
  rankPos:
    'flex h-[1.6rem] w-[1.6rem] flex-none items-center justify-center rounded-full bg-primo-mint text-[0.78rem] font-extrabold text-primo-teal-strong',
  rankName: 'flex-1 font-bold text-primo-ink',
  rankTokens: 'font-extrabold text-primo-teal-strong',
  // Répartition
  aggRow: `grid grid-cols-[1fr_auto_3rem_4rem] items-center gap-2.5 px-1 py-2 ${DIVIDER}`,
  aggMotif: 'font-semibold text-primo-ink',
  aggCat: 'text-[0.72rem] text-primo-muted',
  aggCount: 'text-right text-primo-slate-soft',
  aggTokens: 'text-right font-extrabold text-primo-teal-strong',
  // Chips
  chip: 'inline-block whitespace-nowrap rounded-full bg-primo-mint px-2.5 py-1 text-[0.74rem] font-semibold text-primo-teal-strong',
  chipWarn:
    'inline-block whitespace-nowrap rounded-full bg-primo-warn-soft2 px-2.5 py-1 text-[0.74rem] font-semibold text-primo-warn-strong',
  chipOk:
    'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primo-success-soft px-2.5 py-1 text-[0.74rem] font-semibold text-primo-success',
  chipCloud: 'flex flex-wrap gap-1.5',
  // Angles morts par manager
  bsmRow: `flex items-start gap-3 px-1 py-2.5 ${DIVIDER}`,
  bsmName: 'min-w-[130px] pt-0.5 font-bold text-primo-ink',
  // Équité
  eqRow: `px-1 py-2.5 ${DIVIDER}`,
  eqHead: 'grid grid-cols-[130px_1fr_auto] items-center gap-2.5',
  eqName: 'font-bold text-primo-ink',
  eqBar: 'block h-2 overflow-hidden rounded-full bg-[#f0f3f2]',
  eqRecs: 'm-0 mt-2 flex list-none flex-col gap-1 p-0 pl-0.5',
  eqRec: 'grid grid-cols-[130px_1fr_auto] items-center gap-2.5',
  eqRecName: 'text-[0.85rem] text-primo-slate',
  eqRecBar: 'block h-1.5 overflow-hidden rounded-full bg-[#f0f3f2]',
  eqRecFill: 'block h-full rounded-full bg-gradient-to-r from-primo-teal-100 to-primo-teal-strong',
  eqRecVal: 'whitespace-nowrap text-[0.78rem] font-bold tabular-nums text-primo-teal-strong',
  // Évolution
  evoControls:
    'mb-3.5 flex flex-wrap gap-x-5 gap-y-3 text-[0.85rem] text-primo-slate-soft [&_label]:inline-flex [&_label]:items-center ' +
    '[&_select]:rounded-[11px] [&_select]:border-[1.5px] [&_select]:border-primo-line [&_select]:bg-white [&_select]:px-2.5 [&_select]:py-2 [&_select]:text-primo-ink ' +
    '[&_select:focus]:border-primo-teal [&_select:focus]:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] [&_select:focus]:outline-none',
  evoMulti: 'flex flex-col gap-2.5',
  evoLegend: 'flex flex-wrap gap-x-3.5 gap-y-1.5',
  evoLeg: 'inline-flex items-center gap-1.5 text-[0.74rem] text-primo-slate-soft',
  evoDot: 'inline-block h-[11px] w-[11px] flex-none rounded-[3px]',
  trendSvg: 'h-auto w-full max-w-[620px]',
  trendAxis: 'fill-primo-muted text-[9px]',
  trendVal: 'fill-primo-teal-strong text-[9px] font-bold',
  // Key/value (vélocité)
  kvRow: `flex items-center justify-between px-1 py-2 ${DIVIDER}`,
  kvName: 'font-semibold text-primo-ink',
  kvVal: 'font-extrabold tabular-nums text-primo-ink',
  // Messages + boutons filtres
  msg: 'rounded-xl border border-primo-line bg-white px-4 py-3.5 text-center text-primo-muted',
  msgError: 'rounded-xl border border-primo-error-line bg-primo-error-soft px-4 py-3.5 text-center text-primo-error',
  apply:
    'rounded-xl border-0 bg-primo-teal px-3.5 py-2.5 font-bold text-white shadow-[0_10px_22px_-8px_rgba(0,161,154,0.55)] hover:bg-primo-teal-strong',
  reset: 'ml-1.5 rounded-[11px] border-[1.5px] border-primo-line bg-white px-3 py-1.5 font-bold text-primo-slate',
};

type EqLevel = 'ok' | 'mid' | 'hi';
const eqFill = (lvl: EqLevel) =>
  `block h-full rounded-full ${lvl === 'ok' ? 'bg-primo-success' : lvl === 'mid' ? 'bg-primo-warn' : 'bg-primo-error'}`;
const eqBadge = (lvl: EqLevel) =>
  `whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${
    lvl === 'ok'
      ? 'bg-primo-success-soft text-primo-success'
      : lvl === 'mid'
        ? 'bg-primo-warn-soft text-primo-warn-strong'
        : 'bg-primo-error-soft text-primo-error'
  }`;

// Toutes les courbes en même temps : une ligne colorée par motif + légende.
function MultiMotifChart({ evolution, labelOf }: { evolution: EvolutionPoint[]; labelOf: (t: string) => string }) {
  const periods = Array.from(new Set(evolution.map((e) => e.period))).sort();
  const byMotif = new Map<string, Map<string, number>>();
  for (const p of evolution) {
    const m = byMotif.get(p.motifTag) ?? new Map<string, number>();
    m.set(p.period, p.totalTokens);
    byMotif.set(p.motifTag, m);
  }
  const motifs = Array.from(byMotif.keys());
  const max = Math.max(1, ...evolution.map((e) => e.totalTokens));
  const W = 560, H = 220, padL = 32, padR = 14, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i: number) => padL + (periods.length <= 1 ? innerW / 2 : (i / (periods.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <div className={C.evoMulti}>
      <svg className={C.trendSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Toutes les courbes par motif">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#e3ecea" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" className={C.trendAxis}>{t}</text>
          </g>
        ))}
        {periods.map((p, i) => (
          <text key={p} x={x(i)} y={H - 8} textAnchor="middle" className={C.trendAxis}>{p.slice(2)}</text>
        ))}
        {motifs.map((tag, mi) => {
          const color = PALETTE[mi % PALETTE.length] ?? '#00a19a';
          const series = byMotif.get(tag)!;
          const pts = periods.map((p, i) => `${x(i)},${y(series.get(p) ?? 0)}`).join(' ');
          return (
            <g key={tag}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
              {periods.map((p, i) => (
                <circle key={p} cx={x(i)} cy={y(series.get(p) ?? 0)} r={2.4} fill={color}>
                  <title>{`${labelOf(tag)} · ${p} : ${series.get(p) ?? 0} tokens`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <div className={C.evoLegend}>
        {motifs.map((tag, mi) => (
          <span className={C.evoLeg} key={tag}>
            <span className={C.evoDot} style={{ background: PALETTE[mi % PALETTE.length] ?? '#00a19a' }} />
            {labelOf(tag)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Courbe de progression d'UN motif (mono-ligne, lisible). x = mois, y = tokens.
function MotifTrendChart({ points }: { points: Array<{ period: string; tokens: number }> }) {
  const max = Math.max(1, ...points.map((p) => p.tokens));
  const W = 560, H = 200, padL = 32, padR = 14, padT = 18, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i: number) => padL + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const line = points.map((p, i) => `${x(i)},${y(p.tokens)}`).join(' ');
  return (
    <svg className={C.trendSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Courbe de progression">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#e3ecea" />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" className={C.trendAxis}>{t}</text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={p.period} x={x(i)} y={H - 8} textAnchor="middle" className={C.trendAxis}>{p.period.slice(2)}</text>
      ))}
      <polyline points={line} fill="none" stroke="#00a19a" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.period}>
          <circle cx={x(i)} cy={y(p.tokens)} r={3.2} fill="#00a19a" />
          <text x={x(i)} y={y(p.tokens) - 7} textAnchor="middle" className={C.trendVal}>{p.tokens}</text>
        </g>
      ))}
    </svg>
  );
}

// Section évolution : un motif + un employé sélectionnés → une seule courbe claire.
function EvolutionSection({ evolution, evoMotif, onMotif, evoEmployee, onEmployee, empName, labelOf }: {
  evolution: EvolutionPoint[];
  evoMotif: string;
  onMotif: (t: string) => void;
  evoEmployee: string;
  onEmployee: (id: string) => void;
  empName: Map<string, string>;
  labelOf: (t: string) => string;
}) {
  if (evolution.length === 0) return <p className={C.msg}>Aucune attribution taguée sur la période.</p>;
  const allPeriods = Array.from(new Set(evolution.map((e) => e.period))).sort();
  const totals = new Map<string, number>();
  for (const e of evolution) totals.set(e.motifTag, (totals.get(e.motifTag) ?? 0) + e.totalTokens);
  const motifsInEvo = Array.from(totals.keys()).sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
  // '' (ou motif absent) = toutes les courbes en même temps ; sinon une seule courbe.
  const showAll = evoMotif === '' || !motifsInEvo.includes(evoMotif);
  const series = new Map<string, number>();
  if (!showAll) for (const e of evolution) if (e.motifTag === evoMotif) series.set(e.period, e.totalTokens);
  const points = allPeriods.map((p) => ({ period: p, tokens: series.get(p) ?? 0 }));
  return (
    <>
      <div className={C.evoControls}>
        <label>Motif&nbsp;
          <select value={showAll ? '' : evoMotif} onChange={(e) => onMotif(e.target.value)}>
            <option value="">Tous les motifs</option>
            {motifsInEvo.map((t) => <option key={t} value={t}>{labelOf(t)}</option>)}
          </select>
        </label>
        <label>Employé&nbsp;
          <select value={evoEmployee} onChange={(e) => onEmployee(e.target.value)}>
            <option value="">Toute l'entreprise</option>
            {[...empName.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
      </div>
      {showAll ? <MultiMotifChart evolution={evolution} labelOf={labelOf} /> : <MotifTrendChart points={points} />}
    </>
  );
}

// Tableau de bord statistiques employeur (§3.2/§3.4) — OWNER only.
export default function StatsPage({ onLogout, onBack, onNavTab }: StatsPageProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Référentiels (chargés une fois) pour résoudre id → nom et tag → libellé.
  const [empName, setEmpName] = useState<Map<string, string>>(new Map());
  const [mgrName, setMgrName] = useState<Map<string, string>>(new Map());
  const [motifLabel, setMotifLabel] = useState<Map<string, string>>(new Map());

  // Filtres période (bornes sur la date d'attribution).
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Sélections de la courbe d'évolution (motif affiché + employé ciblé).
  const [evoEmployee, setEvoEmployee] = useState('');
  const [evoMotif, setEvoMotif] = useState('');

  const nameOfEmp = (id: string) => empName.get(id) ?? `${id.slice(0, 8)}…`;
  const nameOfMgr = (id: string) => mgrName.get(id) ?? empName.get(id) ?? `${id.slice(0, 8)}…`;
  const labelOf = (tag: string) => motifLabel.get(tag) ?? tag;

  const loadStats = async (params?: { from?: string; to?: string; employeeId?: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await getStats(params);
      if (res.status === 401) { setError('Session expirée, reconnecte-toi.'); return; }
      if (res.status === 403) { setError('Accès réservé au patron.'); return; }
      if (!res.ok || !res.data) { setError('Impossible de charger les statistiques.'); return; }
      setStats(res.data);
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  // Référentiels + premières stats au montage.
  useEffect(() => {
    (async () => {
      const [empRes, mgrRes, motifRes] = await Promise.all([
        listEmployees(),
        listManagers(),
        listMotifs(),
      ]);
      if (empRes.ok && empRes.data) {
        setEmpName(new Map(empRes.data.employees.map((e: Employee) => [e.id, `${e.firstName} ${e.lastName}`])));
      }
      if (mgrRes.ok && mgrRes.data) {
        setMgrName(new Map(mgrRes.data.managers.map((m: CompanyManager) =>
          [m.id, `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email])));
      }
      if (motifRes.ok && motifRes.data) {
        const map = new Map<string, string>();
        for (const cat of motifRes.data.categories)
          for (const mo of cat.motifs) map.set(mo.tag, mo.label);
        setMotifLabel(map);
      }
    })().catch(() => { /* la résolution des noms restera partielle */ });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
    }, []);

  const paramsWith = (employeeId: string) => ({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(employeeId ? { employeeId } : {}),
  });

  const applyFilters = () => loadStats(paramsWith(evoEmployee));

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setEvoEmployee('');
    loadStats();
  };

  // L'employé ne change que la courbe d'évolution (re-fetch scopé sur lui).
  const selectEvoEmployee = (id: string) => {
    setEvoEmployee(id);
    loadStats(paramsWith(id));
  };

  return (
    <Layout
      title="Prim'O — Statistiques"
      chrome="console"
      hideConsoleMobileHeader
      hideConsoleTopbar
      nav={{
        items: NAV_ITEMS.owner,
        active: 'stats',
        onSelect: (it) => {
          if (it.key === 'stats') return;
          if (onNavTab) onNavTab(it.key);
          else onBack();
        },
      }}
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.owner}
          active="stats"
          onSelect={(it) => { 
            if (it.key === 'stats') return; 
            if (onNavTab) onNavTab(it.key);
            else onBack();
          }}
        />
      }
      sidebarFooter={
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold text-[#6BA8A2] transition hover:bg-white/5 hover:text-primo-error"
        >
          <Icon name="logout" size={16} strokeWidth={1.8} /> Se déconnecter
        </button>
      }
    >
      <div className={C.wrapper}>
        <div className={C.container}>

          <div>
            <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-primo-ink">Statistiques</h1>
            <p className="mt-1 text-[13px] text-primo-slate">Reconnaissance · 30 derniers jours</p>
          </div>

          <div className={C.filters}>
            <label>Du <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>Au <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <button className={C.apply} type="button" onClick={applyFilters}>Appliquer</button>
            {(from || to) && (
              <button className={C.reset} type="button" onClick={resetFilters}>Réinitialiser</button>
            )}
          </div>

          {/* Au 1er chargement seulement : on garde les sections montées pendant un
              re-fetch (sélection employé) pour ne pas réduire la page → pas de saut de scroll. */}
          {!stats && loading && <p className={C.msg}>Chargement des statistiques…</p>}
          {error && (
            <div className={C.msgError}>
              {error} <button className={C.reset} type="button" onClick={() => loadStats()}>Réessayer</button>
            </div>
          )}

          {stats && (
            <>
              {/* ── Top par motif (la donnée phare : « qui est le meilleur dans quoi ») ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="trophy" size={18} className="text-primo-teal-strong" /> Top par motif</h2>
                {stats.leaderboardByMotif.length === 0 ? (
                  <p className={C.msg}>Aucune attribution taguée sur la période.</p>
                ) : (
                  <div className={C.leadGrid}>
                    {stats.leaderboardByMotif.map((row) => (
                      <div className={C.leadCard} key={row.motifTag}>
                        <div className={C.leadCat}>{CATEGORY_LABELS[row.category]}</div>
                        <div className={C.leadMotif}>{labelOf(row.motifTag)}</div>
                        <ol className={C.list}>
                          {row.top.map((t, i) => (
                            <li className={C.leadRow} key={t.employeeId}>
                              <span className={C.leadRank}>{medal(i)}</span>
                              <span className={C.leadName}>{nameOfEmp(t.employeeId)}</span>
                              <span className={C.leadTokens}>{t.tokens}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Classement collaborateurs ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="users" size={18} className="text-primo-teal-strong" /> Classement collaborateurs</h2>
                {stats.ranking.length === 0 ? (
                  <p className={C.msg}>Aucune attribution sur la période.</p>
                ) : (
                  <ul className={C.list}>
                    {stats.ranking.map((r, i) => (
                      <li className={C.rankRow} key={r.employeeId}>
                        <span className={C.rankPos}>{medal(i)}</span>
                        <span className={C.rankName}>{nameOfEmp(r.employeeId)}</span>
                        {r.topMotifTag && <span className={C.chip}>{labelOf(r.topMotifTag)}</span>}
                        <span className={C.rankTokens}>{r.totalTokens}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Répartition par motif ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="chart" size={18} className="text-primo-teal-strong" /> Répartition par motif</h2>
                {stats.motifAggregate.length === 0 ? (
                  <p className={C.msg}>Aucune attribution taguée sur la période.</p>
                ) : (
                  <ul className={C.list}>
                    {stats.motifAggregate.map((a) => (
                      <li className={C.aggRow} key={a.motifTag}>
                        <span className={C.aggMotif}>{labelOf(a.motifTag)}</span>
                        <span className={C.aggCat}>{CATEGORY_LABELS[a.category]}</span>
                        <span className={C.aggCount}>{a.count}×</span>
                        <span className={C.aggTokens}>{a.totalTokens}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Angles morts ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="alert" size={18} className="text-primo-warn-strong" /> Angles morts <small>(motifs jamais utilisés)</small></h2>
                {stats.blindSpots.length === 0 ? (
                  <p className={C.msg}>Aucun angle mort : tous les motifs ont été utilisés.</p>
                ) : (
                  <div className={C.chipCloud}>
                    {stats.blindSpots.map((tag) => <span className={C.chipWarn} key={tag}>{labelOf(tag)}</span>)}
                  </div>
                )}
              </section>

              {/* ── Angles morts PAR manager ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="alert" size={18} className="text-primo-warn-strong" /> Angles morts par manager <small>(motifs jamais utilisés)</small></h2>
                {stats.blindSpotsByManager.length === 0 ? (
                  <p className={C.msg}>Aucune distribution par un manager sur la période.</p>
                ) : (
                  <ul className={C.list}>
                    {stats.blindSpotsByManager.map((m) => (
                      <li className={C.bsmRow} key={m.managerId}>
                        <span className={C.bsmName}>{nameOfMgr(m.managerId)}</span>
                        {m.tags.length === 0 ? (
                          <span className={C.chipOk}><Icon name="check" size={13} strokeWidth={2.4} /> couvre tous les motifs</span>
                        ) : (
                          <span className={C.chipCloud}>
                            {m.tags.map((tag) => <span className={C.chipWarn} key={tag}>{labelOf(tag)}</span>)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Équité : concentration + qui le manager priorise ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="info" size={18} className="text-primo-teal-strong" /> Équité de distribution <small>(qui le manager priorise)</small></h2>
                <p className={C.hint}>
                  Le manager répartit-il ses tokens <strong>également</strong>, ou en
                  <strong> favorise-t-il quelques-uns</strong> ? Le détail montre <strong>à qui</strong> vont ses tokens.
                </p>
                {stats.equityByManager.length === 0 ? (
                  <p className={C.msg}>Aucune distribution par un manager.</p>
                ) : (
                  <ul className={C.list}>
                    {stats.equityByManager.map((e) => {
                      const lvl: EqLevel = e.spread < 0.3 ? 'ok' : e.spread < 0.7 ? 'mid' : 'hi';
                      const label = lvl === 'ok' ? 'Équitable' : lvl === 'mid' ? 'Équilibré' : 'Concentré';
                      const pct = Math.min(100, Math.round(e.spread * 100));
                      return (
                        <li className={C.eqRow} key={e.managerId}>
                          <div className={C.eqHead}>
                            <span className={C.eqName}>{nameOfMgr(e.managerId)}</span>
                            <span className={C.eqBar}><span className={eqFill(lvl)} style={{ width: `${pct}%` }} /></span>
                            <span className={eqBadge(lvl)}>{label}</span>
                          </div>
                          <ul className={C.eqRecs}>
                            {e.recipients.map((r) => (
                              <li className={C.eqRec} key={r.employeeId}>
                                <span className={C.eqRecName}>{nameOfEmp(r.employeeId)}</span>
                                <span className={C.eqRecBar}><span className={C.eqRecFill} style={{ width: `${Math.round(r.share * 100)}%` }} /></span>
                                <span className={C.eqRecVal}>{r.tokens} · {Math.round(r.share * 100)}%</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* ── Vélocité par manager ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="clock" size={18} className="text-primo-teal-strong" /> Vélocité de distribution</h2>
                <p className={C.hint}>
                  Temps moyen entre le moment où le manager <strong>reçoit son enveloppe</strong> et sa
                  <strong> première distribution</strong>. Plus c'est court, plus il redistribue vite.
                </p>
                {stats.velocityByManager.length === 0 ? (
                  <p className={C.msg}>Aucune allocation enregistrée.</p>
                ) : (
                  <ul className={C.list}>
                    {stats.velocityByManager.map((v) => (
                      <li className={C.kvRow} key={v.managerId}>
                        <span className={C.kvName}>{nameOfMgr(v.managerId)}</span>
                        <span className={C.kvVal}>{formatDelay(v.avgDelaySeconds)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Évolution d'un motif dans le temps (courbe de progression) ── */}
              <section className={C.section}>
                <h2 className={C.title}><Icon name="chart" size={18} className="text-primo-teal-strong" /> Évolution d'un motif dans le temps</h2>
                <p className={C.hint}>
                  Suis la <strong>progression d'un motif</strong> mois par mois. Choisis un
                  <strong> employé</strong> pour voir sa courbe de progression personnelle.
                </p>
                <EvolutionSection
                  evolution={stats.evolution}
                  evoMotif={evoMotif}
                  onMotif={setEvoMotif}
                  evoEmployee={evoEmployee}
                  onEmployee={selectEvoEmployee}
                  empName={empName}
                  labelOf={labelOf}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
