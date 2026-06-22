import { useState } from 'react';
import type { ApiResult } from '@/services/api';
import type { Paginated } from '@/types/types';

// Liste paginée « voir plus » : items accumulés + page courante + reste-t-il des pages.
// Générique : tout historique paginé (reçus, dépenses, …) partage cette mécanique.
export function usePaginatedList<T>(
  fetchPage: (page: number, limit: number) => Promise<ApiResult<Paginated<T>>>,
  pageSize: number,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Réinitialise depuis la 1re page (chargement initial groupé du dashboard).
  const seed = (firstItems: T[], more: boolean) => {
    setItems(firstItems);
    setPage(1);
    setHasMore(more);
  };

  // Charge la page suivante et l'ajoute à la liste existante.
  const loadMore = async () => {
    const next = page + 1;
    const res = await fetchPage(next, pageSize);
    if (res.ok && res.data) {
      setItems((prev) => [...prev, ...res.data!.items]);
      setPage(next);
      setHasMore(res.data.hasMore);
    }
  };

  return { items, hasMore, seed, loadMore };
}
