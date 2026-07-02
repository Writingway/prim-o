import { useEffect, useState } from 'react';
import {
  getStats,
  listEmployees,
  listManagers,
  listMotifs,
  type StatsResponse,
  type CompanyManager,
} from '../services/api';
import type { Employee } from '../types/types';

// Employer statistics dashboard (§3.2/§3.4) — data logic extracted from StatsPage: reference
// maps (id → name, tag → label), stats fetching, period filters and evolution-chart selection.
// The page itself only renders.
export function useStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reference maps (loaded once) to resolve id → name and tag → label.
  const [empName, setEmpName] = useState<Map<string, string>>(new Map());
  const [mgrName, setMgrName] = useState<Map<string, string>>(new Map());
  const [motifLabel, setMotifLabel] = useState<Map<string, string>>(new Map());

  // Period filters (bounds on the attribution date).
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Evolution-chart selections: which motif (domain term for a bonus reason) is plotted, and for
  // which employee.
  const [evoEmployee, setEvoEmployee] = useState('');
  const [evoMotif, setEvoMotif] = useState('');

  // Neutral fallback when a name is unknown: NEVER expose the raw identifier.
  // `stats.managerNames` (provided by the backend) also covers the owner granting bonuses
  // directly, who would otherwise show up as « Manager inconnu ».
  const nameOfEmp = (id: string) => empName.get(id) ?? 'Employé inconnu';
  const nameOfMgr = (id: string) =>
    stats?.managerNames?.[id] ?? mgrName.get(id) ?? empName.get(id) ?? 'Manager inconnu';
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

  // Load the reference maps and the first stats on mount.
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
    })().catch(() => { /* name resolution just stays partial */ });
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

  // Changing the employee only affects the evolution chart (re-fetch scoped to that employee).
  const selectEvoEmployee = (id: string) => {
    setEvoEmployee(id);
    loadStats(paramsWith(id));
  };

  return {
    stats, loading, error,
    empName, evoMotif, evoEmployee, from, to,
    nameOfEmp, nameOfMgr, labelOf,
    loadStats, applyFilters, resetFilters, selectEvoEmployee,
    setFrom, setTo, setEvoMotif,
  };
}
