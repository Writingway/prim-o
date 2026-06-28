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

// Tableau de bord statistiques employeur (§3.2/§3.4) — logique data extraite
// de StatsPage : référentiels (id→nom, tag→libellé), fetch des stats, filtres
// période + sélection de la courbe d'évolution. La page ne fait plus que rendre.
export function useStats() {
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

  return {
    stats, loading, error,
    empName, evoMotif, evoEmployee, from, to,
    nameOfEmp, nameOfMgr, labelOf,
    loadStats, applyFilters, resetFilters, selectEvoEmployee,
    setFrom, setTo, setEvoMotif,
  };
}
