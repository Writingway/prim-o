import { useEffect, useState } from 'react';
import {
  getEmployeeBalance,
  getEmployeeReceived,
  getEmployeeSpent,
  logout as apiLogout,
} from '@/services/api';
import { usePaginatedList } from './usePaginatedList';

const PAGE_SIZE = 10;

// Espace employé : solde + 2 historiques paginés (reçus / dépenses).
export function useEmployeeDashboard(onLogout: () => void) {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const received = usePaginatedList(getEmployeeReceived, PAGE_SIZE);
  const spent = usePaginatedList(getEmployeeSpent, PAGE_SIZE);

  // Chargement initial groupé : solde + 1re page de chaque historique, un seul spinner.
  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [balRes, recRes, spRes] = await Promise.all([
        getEmployeeBalance(),
        getEmployeeReceived(1, PAGE_SIZE),
        getEmployeeSpent(1, PAGE_SIZE),
      ]);

      if (balRes.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        return;
      }
      if (!balRes.ok || !balRes.data) {
        setError('Impossible de charger ton espace.');
        return;
      }

      setBalance(balRes.data.balance);
      if (recRes.ok && recRes.data) received.seed(recRes.data.items, recRes.data.hasMore);
      if (spRes.ok && spRes.data) spent.seed(spRes.data.items, spRes.data.hasMore);
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // On déconnecte côté front même si l'appel réseau échoue.
    }
    onLogout();
  };

  return { balance, error, loading, reload, received, spent, handleLogout };
}
