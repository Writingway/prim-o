import { useEffect, useState } from 'react';
import {
  listEmployees,
  getCompany,
  listAttributions,
  listManagers,
  getMyBalance,
} from '@/services/api';
import type { CompanyManager } from '@/services/api';
import type { Employee, Company, AttributionHistory, Role } from '@/types/types';

// Couche data du dashboard employeur : fetch initial + rechargement.
// Extrait de ManagerDashboard (roadmap STRUCTURE.md §2). Aucun changement de comportement.
export function useManagerData(role: Role) {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [attributions, setAttributions] = useState<AttributionHistory[]>([]);
  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [managers, setManagers] = useState<CompanyManager[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, compRes, attrRes] = await Promise.all([
        listEmployees(),
        getCompany(),
        listAttributions(),
      ]);

      if (empRes.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        return;
      }
      if (!empRes.ok || !empRes.data) {
        setError('Impossible de charger les employés.');
        return;
      }

      setEmployees(empRes.data.employees);
      if (compRes.ok && compRes.data) setCompany(compRes.data.company);
      if (attrRes.ok && attrRes.data) setAttributions(attrRes.data.attributions);

      // Manager : son solde perso. Patron : la liste des managers à alimenter.
      if (role === 'manager') {
        const balRes = await getMyBalance();
        if (balRes.ok && balRes.data) setMyBalance(balRes.data.balance);
      } else if (role === 'owner') {
        const mgrRes = await listManagers();
        if (mgrRes.ok && mgrRes.data) setManagers(mgrRes.data.managers);
      }
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    employees,
    company,
    attributions,
    myBalance,
    managers,
    error,
    setError,
    loading,
    reload,
  };
}
