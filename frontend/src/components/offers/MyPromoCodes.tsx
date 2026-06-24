import { useEffect, useState } from 'react';
import { getEmployeeSpent, setSpentUsed } from '@/services/api';
import type { SpentToken } from '@/types/types';
import Icon from '@/components/ui/Icon';
import { formatDate } from '@/lib/format';

// « Mes codes » : les codes promo achetés par l'utilisateur connecté (employé OU
// manager — /employees/me/spent est filtré par user). Deux catégories pilotées
// par l'utilisateur : « Disponible » (pas encore utilisé) et « Utilisé ». Un
// bouton fait basculer le code de l'une à l'autre (persisté en base).
const PAGE_SIZE = 10;

type View = 'available' | 'used';

export default function MyPromoCodes() {
  const [items, setItems] = useState<SpentToken[]>([]);
  const [view, setView] = useState<View>('available');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const load = async (p: number) => {
    setError('');
    const res = await getEmployeeSpent(p, PAGE_SIZE);
    if (res.ok && res.data) {
      setItems((prev) => (p === 1 ? res.data!.items : [...prev, ...res.data!.items]));
      setHasMore(res.data.hasMore);
      setPage(p);
    } else if (res.status === 401) {
      setError('Session expirée, reconnecte-toi.');
    } else {
      setError('Impossible de charger tes codes.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
  };

  // Bascule « utilisé » : mise à jour optimiste, repli si l'appel échoue.
  const toggleUsed = async (id: string, used: boolean) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, used } : it)));
    const res = await setSpentUsed(id, used);
    if (!res.ok) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, used: !used } : it)));
    }
  };

  const available = items.filter((i) => !i.used);
  const used = items.filter((i) => i.used);
  const shown = view === 'available' ? available : used;

  return (
    <section>

      {loading ? (
        <p className="mt-8 text-center text-sm font-medium text-primo-muted">Chargement…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-primo-error-soft px-4 py-3 text-center text-[13px] text-primo-error">{error}</p>
      ) : (
        <>
          {/* Switch de catégorie Disponible / Utilisé */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-primo-mint p-1">
            <button
              type="button"
              onClick={() => setView('available')}
              className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition ${
                view === 'available' ? 'bg-white text-primo-success shadow-sm' : 'text-primo-slate'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-primo-success" />
              Disponible ({available.length})
            </button>
            <button
              type="button"
              onClick={() => setView('used')}
              className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition ${
                view === 'used' ? 'bg-white text-primo-error shadow-sm' : 'text-primo-slate'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-primo-error" />
              Utilisé ({used.length})
            </button>
          </div>

          {shown.length === 0 ? (
            <p className="mt-8 text-center text-sm font-medium text-primo-muted">
              {view === 'available' ? "Aucun code pour l'instant. Échange tes jetons dans les Offres." : 'Aucun code utilisé pour l\'instant.'}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {shown.map((t) => (
                <li
                  key={t.id}
                  className={`overflow-hidden rounded-2xl border border-primo-line border-l-[3px] bg-white ${
                    t.used ? 'border-l-primo-error' : 'border-l-primo-success'
                  }`}
                >
                  <div className="px-4 pt-3.5">
                    <div className="truncate text-[15px] font-bold text-primo-ink">{t.offerName}</div>
                    <div className="text-xs text-primo-muted">{formatDate(t.createdAt)} · −{t.amount} tokens</div>
                  </div>

                  {/* Code copiable */}
                  <div className="mx-3.5 mt-3 flex items-center gap-2 rounded-xl border-[1.5px] border-dashed border-primo-gold-bright/60 bg-primo-gold-soft px-3.5 py-2.5">
                    <span className={`flex-1 break-all font-mono text-base font-extrabold tracking-[2px] text-primo-ink ${t.used ? 'line-through opacity-60' : ''}`}>
                      {t.promoCode}
                    </span>
                    {!t.used && (
                      <button
                        type="button"
                        onClick={() => copy(t.promoCode)}
                        className="flex flex-none items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-bold text-primo-teal-strong transition hover:bg-primo-mint"
                      >
                        <Icon name={copied === t.promoCode ? 'check' : 'copy'} size={15} strokeWidth={copied === t.promoCode ? 2.4 : 1.8} />
                        {copied === t.promoCode ? 'Copié' : 'Copier'}
                      </button>
                    )}
                  </div>

                  {/* Marquer utilisé = définitif (pas de retour). Une fois utilisé,
                      on n'affiche plus qu'un statut figé. */}
                  <div className="p-3.5 pt-3">
                    {t.used ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-primo-error-soft py-2.5 text-sm font-bold text-primo-error">
                        <Icon name="check" size={16} strokeWidth={2.2} /> Code utilisé
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleUsed(t.id, true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primo-error-soft py-2.5 text-sm font-bold text-primo-error transition hover:brightness-95"
                      >
                        <Icon name="check" size={16} strokeWidth={2.2} /> Marquer comme utilisé
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => load(page + 1)}
              className="mx-auto mt-4 block rounded-full border-[1.5px] border-primo-line bg-white px-6 py-2.5 text-sm font-bold text-primo-teal-strong transition hover:border-primo-teal hover:bg-primo-mint"
            >
              Voir plus
            </button>
          )}
        </>
      )}
    </section>
  );
}
