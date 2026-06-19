import { useEffect, useState } from 'react';
import {
  getManagerBalances,
  getManagerHistory,
  type ManagerBalances as Balances,
  type ManagerHistory,
} from '../../services/api';

// §3.3 Dashboard manager : 2 panneaux de solde (enveloppe à distribuer /
// solde perso reçu) + 2 historiques (envoyés / reçus). Mobile-first, gamifié.
// Composant isolé : se branche dans ManagerDashboard sans toucher au reste.

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

type Tab = 'sent' | 'received';

export default function ManagerBalances() {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [history, setHistory] = useState<ManagerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('sent');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      const [b, h] = await Promise.all([getManagerBalances(), getManagerHistory()]);
      if (!alive) return;
      if (!b.ok || !b.data || !h.ok || !h.data) {
        setError('Impossible de charger les soldes. Réessaie.');
      } else {
        setBalances(b.data);
        setHistory(h.data);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-primo-teal-soft animate-pulse" />
        <div className="h-28 rounded-2xl bg-primo-teal-soft animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-primo-error/30 bg-primo-error/5 p-4 text-sm text-primo-error">
        {error}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {/* 2 panneaux de solde */}
      <div className="grid grid-cols-2 gap-3">
        <BalanceCard
          label="Enveloppe à distribuer"
          value={balances?.envelopeRemaining ?? 0}
          tone="envelope"
        />
        <BalanceCard
          label="Mon solde perso"
          value={balances?.personalBalance ?? 0}
          tone="personal"
        />
      </div>

      {/* Onglets historiques (mobile-first : 1 visible à la fois) */}
      <div className="flex gap-2">
        <TabButton active={tab === 'sent'} onClick={() => setTab('sent')}>
          Envoyés
        </TabButton>
        <TabButton active={tab === 'received'} onClick={() => setTab('received')}>
          Reçus
        </TabButton>
      </div>

      {tab === 'sent' ? (
        <ul className="flex flex-col gap-2">
          {history && history.sent.length > 0 ? (
            history.sent.map((row) => (
              <li
                key={row.attributionId}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-primo-border"
              >
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-primo-teal-soft px-2 py-0.5 text-xs font-semibold text-primo-teal-dark">
                    {row.motifTag}
                  </span>
                  <p className="mt-1 truncate text-xs text-primo-gray">{fmtDate(row.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primo-ink">-{row.amount}</p>
                  {row.retributionAmount > 0 && (
                    <p className="text-xs font-medium text-primo-success">
                      +{row.retributionAmount} pour toi
                    </p>
                  )}
                </div>
              </li>
            ))
          ) : (
            <EmptyRow text="Aucune distribution envoyée." />
          )}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {history && history.received.length > 0 ? (
            history.received.map((row, i) => (
              <li
                key={row.sourceAllocationId ?? `r-${i}`}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-primo-border"
              >
                <p className="text-xs text-primo-gray">{fmtDate(row.createdAt)}</p>
                <p className="font-bold text-primo-success">+{row.amount}</p>
              </li>
            ))
          ) : (
            <EmptyRow text="Aucun jeton reçu." />
          )}
        </ul>
      )}
    </section>
  );
}

function BalanceCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'envelope' | 'personal';
}) {
  const bg =
    tone === 'envelope'
      ? 'bg-gradient-to-br from-primo-teal to-primo-teal-dark text-white'
      : 'bg-white text-primo-ink ring-1 ring-primo-border';
  const sub = tone === 'envelope' ? 'text-white/80' : 'text-primo-gray';
  return (
    <div className={`flex flex-col gap-1 rounded-2xl p-4 ${bg}`}>
      <span className={`text-xs font-medium ${sub}`}>{label}</span>
      <span className="text-3xl font-extrabold tabular-nums leading-none">{value}</span>
      <span className={`text-xs ${sub}`}>jetons</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-primo-teal text-white shadow-sm'
          : 'bg-primo-teal-soft text-primo-teal-dark'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <li className="rounded-xl bg-primo-teal-soft/50 p-4 text-center text-sm text-primo-gray">
      {text}
    </li>
  );
}
