import { useState } from 'react';
import type { ApiResult } from '@/services/api';
import type { Paginated } from '@/types/types';

// "Load more" style pagination: accumulated items + current page + whether more pages remain.
// Generic: every paginated history (received, spent, ...) shares this mechanic.
export function usePaginatedList<T>(
  fetchPage: (page: number, limit: number) => Promise<ApiResult<Paginated<T>>>,
  pageSize: number,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Reset from page 1 (used by the dashboard's grouped initial load).
  const seed = (firstItems: T[], more: boolean) => {
    setItems(firstItems);
    setPage(1);
    setHasMore(more);
  };

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
