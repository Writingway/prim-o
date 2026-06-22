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
import './StatsPage.css';

type StatsPageProps = {
  onLogout: () => void;
  onBack: () => void;
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

const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`);

const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777', '#0891b2', '#65a30d'];

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
    <div className="evo-multi">
      <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Toutes les courbes par motif">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#eceef3" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="trend-axis">{t}</text>
          </g>
        ))}
        {periods.map((p, i) => (
          <text key={p} x={x(i)} y={H - 8} textAnchor="middle" className="trend-axis">{p.slice(2)}</text>
        ))}
        {motifs.map((tag, mi) => {
          const color = PALETTE[mi % PALETTE.length] ?? '#7c3aed';
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
      <div className="evo2-legend">
        {motifs.map((tag, mi) => (
          <span className="evo2-leg" key={tag}>
            <span className="evo2-dot" style={{ background: PALETTE[mi % PALETTE.length] ?? '#7c3aed' }} />
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
    <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Courbe de progression">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#eceef3" />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="trend-axis">{t}</text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={p.period} x={x(i)} y={H - 8} textAnchor="middle" className="trend-axis">{p.period.slice(2)}</text>
      ))}
      <polyline points={line} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.period}>
          <circle cx={x(i)} cy={y(p.tokens)} r={3.2} fill="#7c3aed" />
          <text x={x(i)} y={y(p.tokens) - 7} textAnchor="middle" className="trend-val">{p.tokens}</text>
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
  if (evolution.length === 0) return <p className="dash-msg">Aucune attribution taguée sur la période.</p>;
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
      <div className="evo-controls">
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
export default function StatsPage({ onLogout, onBack }: StatsPageProps) {
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
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      headerActions={
        <>
          <button className="app-btn app-btn-ghost" type="button" onClick={onBack}>← Dashboard</button>
          <button className="app-btn app-btn-ghost" type="button" onClick={onLogout}>Se déconnecter</button>
        </>
      }
    >
      <div className="stats-wrapper">
        <div className="stats-container">

          <div className="stats-filters">
            <label>Du <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>Au <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <button className="dash-invite" type="button" onClick={applyFilters}>Appliquer</button>
            {(from || to) && (
              <button className="dash-retry" type="button" onClick={resetFilters}>Réinitialiser</button>
            )}
          </div>

          {/* Au 1er chargement seulement : on garde les sections montées pendant un
              re-fetch (sélection employé) pour ne pas réduire la page → pas de saut de scroll. */}
          {!stats && loading && <p className="dash-msg">Chargement des statistiques…</p>}
          {error && (
            <div className="dash-msg dash-error">
              {error} <button className="dash-retry" type="button" onClick={() => loadStats()}>Réessayer</button>
            </div>
          )}

          {stats && (
            <>
              {/* ── Top par motif (la donnée phare : « qui est le meilleur dans quoi ») ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">🏆 Top par motif</h2>
                {stats.leaderboardByMotif.length === 0 ? (
                  <p className="dash-msg">Aucune attribution taguée sur la période.</p>
                ) : (
                  <div className="lead-grid">
                    {stats.leaderboardByMotif.map((row) => (
                      <div className="lead-card" key={row.motifTag}>
                        <div className="lead-cat">{CATEGORY_LABELS[row.category]}</div>
                        <div className="lead-motif">{labelOf(row.motifTag)}</div>
                        <ol className="lead-list">
                          {row.top.map((t, i) => (
                            <li className="lead-row" key={t.employeeId}>
                              <span className="lead-rank">{medal(i)}</span>
                              <span className="lead-name">{nameOfEmp(t.employeeId)}</span>
                              <span className="lead-tokens">{t.tokens}🪙</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Classement collaborateurs ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">📊 Classement collaborateurs</h2>
                {stats.ranking.length === 0 ? (
                  <p className="dash-msg">Aucune attribution sur la période.</p>
                ) : (
                  <ul className="rank-list">
                    {stats.ranking.map((r, i) => (
                      <li className="rank-row" key={r.employeeId}>
                        <span className="rank-pos">{medal(i)}</span>
                        <span className="rank-name">{nameOfEmp(r.employeeId)}</span>
                        {r.topMotifTag && <span className="chip">{labelOf(r.topMotifTag)}</span>}
                        <span className="rank-tokens">{r.totalTokens}🪙</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Répartition par motif ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">🎯 Répartition par motif</h2>
                {stats.motifAggregate.length === 0 ? (
                  <p className="dash-msg">Aucune attribution taguée sur la période.</p>
                ) : (
                  <ul className="agg-list">
                    {stats.motifAggregate.map((a) => (
                      <li className="agg-row" key={a.motifTag}>
                        <span className="agg-motif">{labelOf(a.motifTag)}</span>
                        <span className="agg-cat">{CATEGORY_LABELS[a.category]}</span>
                        <span className="agg-count">{a.count}×</span>
                        <span className="agg-tokens">{a.totalTokens}🪙</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Angles morts ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">🕳️ Angles morts <small>(motifs jamais utilisés)</small></h2>
                {stats.blindSpots.length === 0 ? (
                  <p className="dash-msg">Aucun angle mort : tous les motifs ont été utilisés. 🎉</p>
                ) : (
                  <div className="chip-cloud">
                    {stats.blindSpots.map((tag) => <span className="chip chip-warn" key={tag}>{labelOf(tag)}</span>)}
                  </div>
                )}
              </section>

              {/* ── Angles morts PAR manager ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">🧭 Angles morts par manager <small>(motifs jamais utilisés)</small></h2>
                {stats.blindSpotsByManager.length === 0 ? (
                  <p className="dash-msg">Aucune distribution par un manager sur la période.</p>
                ) : (
                  <ul className="bsm-list">
                    {stats.blindSpotsByManager.map((m) => (
                      <li className="bsm-row" key={m.managerId}>
                        <span className="bsm-name">{nameOfMgr(m.managerId)}</span>
                        {m.tags.length === 0 ? (
                          <span className="chip chip-ok">✓ couvre tous les motifs</span>
                        ) : (
                          <span className="chip-cloud">
                            {m.tags.map((tag) => <span className="chip chip-warn" key={tag}>{labelOf(tag)}</span>)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Équité : concentration + qui le manager priorise ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">⚖️ Équité de distribution <small>(qui le manager priorise)</small></h2>
                <p className="stats-hint">
                  Le manager répartit-il ses tokens <strong>également</strong>, ou en
                  <strong> favorise-t-il quelques-uns</strong> ? Le détail montre <strong>à qui</strong> vont ses tokens.
                </p>
                {stats.equityByManager.length === 0 ? (
                  <p className="dash-msg">Aucune distribution par un manager.</p>
                ) : (
                  <ul className="eq-list">
                    {stats.equityByManager.map((e) => {
                      const lvl = e.spread < 0.3 ? 'ok' : e.spread < 0.7 ? 'mid' : 'hi';
                      const label = lvl === 'ok' ? 'Équitable' : lvl === 'mid' ? 'Équilibré' : 'Concentré';
                      const pct = Math.min(100, Math.round(e.spread * 100));
                      return (
                        <li className="eq-row" key={e.managerId}>
                          <div className="eq-head">
                            <span className="eq-name">{nameOfMgr(e.managerId)}</span>
                            <span className="eq-bar"><span className={`eq-fill eq-${lvl}`} style={{ width: `${pct}%` }} /></span>
                            <span className={`eq-badge eq-${lvl}`}>{label}</span>
                          </div>
                          <ul className="eq-recs">
                            {e.recipients.map((r) => (
                              <li className="eq-rec" key={r.employeeId}>
                                <span className="eq-rec-name">{nameOfEmp(r.employeeId)}</span>
                                <span className="eq-rec-bar"><span className="eq-rec-fill" style={{ width: `${Math.round(r.share * 100)}%` }} /></span>
                                <span className="eq-rec-val">{r.tokens}🪙 · {Math.round(r.share * 100)}%</span>
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
              <section className="stats-section">
                <h2 className="stats-section-title">⏱️ Vélocité de distribution</h2>
                  <p className="stats-hint">
                    Temps moyen entre le moment où le manager <strong>reçoit son enveloppe</strong> et sa
                    <strong> première distribution</strong>. Plus c'est court, plus il redistribue vite.
                  </p>
                  {stats.velocityByManager.length === 0 ? (
                    <p className="dash-msg">Aucune allocation enregistrée.</p>
                  ) : (
                    <ul className="kv-list">
                      {stats.velocityByManager.map((v) => (
                        <li className="kv-row" key={v.managerId}>
                          <span className="kv-name">{nameOfMgr(v.managerId)}</span>
                          <span className="kv-val">{formatDelay(v.avgDelaySeconds)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

              {/* ── Évolution d'un motif dans le temps (courbe de progression) ── */}
              <section className="stats-section">
                <h2 className="stats-section-title">📈 Évolution d'un motif dans le temps</h2>
                <p className="stats-hint">
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
