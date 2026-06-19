import { useEffect, useState } from 'react';
import {
  deleteEmployee,
  generateInviteCode,
  approveEmployee as apiApproveEmployee,
  createCheckout,
  logout as apiLogout,
} from '@/services/api';
import type { Employee, Role } from '@/types/types';
import Layout from '@/components/layout/Layout';
import ManagerBalances from '@/components/manager/ManagerBalances';
import DistributeForm from '@/components/manager/DistributeForm';
import BottomNav from '@/components/layout/BottomNav';
import PrivacySection from '@/components/privacy/PrivacySection';
import EditProfile from '@/components/privacy/EditProfile';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useManagerData } from '@/hooks/useManagerData';
import { useAllocation } from '@/hooks/useAllocation';
import { useAttribution } from '@/hooks/useAttribution';
import { formatDate } from '@/lib/format';
import { HEADER_BTN_GHOST } from '@/components/layout/headerButtons';

const WRAPPER = 'min-h-screen bg-[#f4f5f7] px-4 py-6 sm:px-5';
const CONTAINER = 'mx-auto flex w-full max-w-[760px] flex-col';
const STATS = 'mb-4 flex flex-wrap items-center gap-2.5';
const STAT = 'rounded-lg border border-primo-border bg-primo-bg px-3.5 py-2 text-[14px] text-[#374151]';
const STAT_POOL = 'border-[#cfe9e7] bg-primo-teal-soft';
const INVITE = 'ml-auto rounded-lg border border-dashed border-[#c7c7d1] bg-primo-bg px-3.5 py-2 text-[14px] font-semibold text-primo-ink transition hover:bg-primo-teal-dark hover:text-white';
const RECHARGE = 'mb-4 flex flex-wrap items-center gap-2';
const RECHARGE_INPUT = 'w-[130px] rounded-lg border border-[#d1d5db] bg-primo-bg px-[10px] py-2 text-[14px] text-[#1f2937] outline-none focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]';
const MSG = 'py-8 text-center text-primo-gray';
const ERROR = 'text-primo-error';
const RETRY = 'ml-2 rounded-md border-0 bg-primo-teal px-2.5 py-1 text-white cursor-pointer';
const LIST = 'm-0 flex list-none flex-col gap-2 p-0';
const ITEM = 'rounded-[10px] border border-primo-border bg-primo-bg px-3.5 py-3';
const ROW = 'flex items-center gap-3';
const AVATAR = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primo-teal text-sm font-bold text-white';
const MAIN = 'min-w-0 flex-1';
const NAME = 'flex items-center gap-2 font-semibold text-[#111827]';
const SUB = 'truncate text-xs text-primo-gray';
const BALANCE = 'shrink-0 text-right';
const BALANCE_NUM = 'text-[20px] font-bold text-[#1f2937]';
const BALANCE_LABEL = 'text-[11px] text-primo-gray-light';
const ACTION_BTN = 'shrink-0 rounded-lg border border-primo-teal bg-primo-bg px-3 py-2 text-[13px] font-semibold text-primo-teal transition hover:bg-primo-teal-soft';
const DELETE_BTN = 'shrink-0 rounded-lg border border-[#f0c9c9] bg-primo-bg px-3 py-2 text-[13px] font-semibold text-primo-error transition hover:bg-[#fef2f2]';
const FORM = 'mt-3 flex flex-wrap items-center gap-2 border-t border-[#eef0f3] pt-3';
const INPUT = 'rounded-lg border border-[#d1d5db] bg-primo-bg px-[10px] py-2 text-[14px] text-[#1f2937] outline-none focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)]';
const INPUT_NUM = 'w-[110px]';
const INPUT_TEXT = 'min-w-[160px] flex-1';
const SUBMIT = 'rounded-lg bg-primo-teal px-4 py-[9px] text-[14px] font-semibold text-white transition hover:bg-primo-teal-dark disabled:cursor-not-allowed disabled:opacity-60';
const HISTORY = 'mb-4 rounded-[12px] border border-primo-border bg-primo-bg px-[18px] py-4';
const HISTORY_TITLE = 'mb-3 text-[15px] font-bold text-[#1f2937]';
const HISTORY_LIST = 'm-0 flex list-none flex-col gap-2 p-0';
const HISTORY_ROW = 'grid grid-cols-1 gap-2 rounded-[10px] border border-[#ececf1] bg-[#fafafb] px-3 py-2.5 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center';
const HISTORY_EMP = 'text-sm font-semibold text-[#1f2937]';
const HISTORY_REASON = 'text-sm text-[#1f2937]';
const HISTORY_DATE = 'text-xs text-primo-gray';
const HISTORY_AMOUNT = 'justify-self-start text-base font-bold text-primo-success sm:justify-self-end';
const BADGE = 'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold';
const BADGE_VERIFIED = 'bg-[#ecfdf5] text-primo-success';

type ManagerDashboardProps = {
  role: Role;
  onLogout: () => void;
  onBack: () => void;
};

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

// Dashboard employeur : liste des employés de son entreprise (lecture seule).
export default function ManagerDashboard({ role, onLogout, onBack }: ManagerDashboardProps) {
  const { confirm, confirmDialog } = useConfirm();
  const {
    employees, company, attributions, myBalance, managers,
    error, setError, loading, reload,
  } = useManagerData(role);
  const alloc = useAllocation(reload);
  const attrib = useAttribution(reload);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  // Recharge du pool via Stripe.
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<'success' | 'cancel' | null>(null);

  const handleDelete = async (e: Employee) => {
    const ok = await confirm({
      title: 'Supprimer cet employé ?',
      message: `Supprimer ${e.firstName} ${e.lastName} ? Son historique est conservé.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(e.id);
    try {
      const res = await deleteEmployee(e.id);
      if (res.ok) {
        await reload(); // recharge liste + solde + historique
      } else {
        setError("Impossible de supprimer cet employé.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // On déconnecte côté front même si l'appel échoue.
    }
    onLogout();
  };

  const handleGenerateInvite = async (inviteRole: 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE') => {
    setInviteError('');
    try {
      const res = await generateInviteCode(inviteRole);
      if (res.ok && res.data?.invite) {
        setInviteCode(res.data.invite.code);
      } else if (res.status === 401) {
        setInviteError('Session expirée, reconnecte-toi.');
      } else {
        setInviteError('Impossible de générer le code d\'invitation.');
      }
    } catch {
      setInviteError('Impossible de joindre le serveur.');
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    const amount = Number(rechargeAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setRechargeError('Le montant doit être un entier positif.');
      return;
    }
    setRecharging(true);
    try {
      const res = await createCheckout(amount);
      if (res.ok && res.data?.url) {
        window.location.href = res.data.url; // on quitte le SPA pour la page Stripe
      } else if (res.status === 401) {
        setRechargeError('Session expirée, reconnecte-toi.');
      } else {
        setRechargeError('Impossible de démarrer le paiement.');
      }
    } catch {
      setRechargeError('Impossible de joindre le serveur.');
    } finally {
      setRecharging(false);
    }
  };

  // Retour de Stripe : lit ?payment=success|cancel, affiche un message,
  // nettoie l'URL, et recharge le solde (le webhook crédite en ~1-2 s).
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment === 'success' || payment === 'cancel') {
      setPaymentNotice(payment);
      window.history.replaceState({}, '', window.location.pathname);
      if (payment === 'success') {
        setTimeout(() => { reload(); }, 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  // Approve button pour manager quand l'employé est en attente.
  const approveEmployee = async (employeeId: string) => {
    try {
      // Passe par api.ts : profite du wrapper 401 → refresh → retry.
      const res = await apiApproveEmployee(employeeId);
      if (res.ok) {
        await reload();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError("Impossible d'approuver cet employé.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  return (
    <Layout
      title="Prim'O - Mes employés"
      chrome={role === 'manager' ? 'app' : 'public'}
      bottomNav={
        role === 'manager' ? (
          <BottomNav
            items={[
              { key: 'solde', label: 'Solde', icon: '🪙', targetId: 'nav-solde' },
              { key: 'distribuer', label: 'Distribuer', icon: '🎁', targetId: 'nav-distribuer' },
              { key: 'equipe', label: 'Équipe', icon: '👥', targetId: 'nav-equipe' },
              { key: 'profil', label: 'Profil', icon: '👤', targetId: 'nav-profil' },
            ]}
          />
        ) : undefined
      }
      headerActions={
        <>
          <button className={HEADER_BTN_GHOST} type="button" onClick={onBack}>
             Accueil
          </button>
          <button className={HEADER_BTN_GHOST} type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </>
      }
    >
    <div className={WRAPPER}>
      <div className={CONTAINER}>

        {/* §3.3 — double solde (enveloppe / perso) + historiques envoyés/reçus. */}
        {role === 'manager' && (
          <div className="mb-4 flex flex-col gap-4">
            <div id="nav-solde" className="scroll-mt-20">
              <ManagerBalances />
            </div>
            <div id="nav-distribuer" className="scroll-mt-20">
              <DistributeForm employees={employees ?? []} onDone={reload} />
            </div>
          </div>
        )}

        <div className={STATS}>
          <div className={`${STAT} ${STAT_POOL}`}>🏦 <strong>{company?.tokenBalance ?? '-'}</strong>&nbsp;pool entreprise</div>
          {role === 'manager' && (
            <div className={STAT}>🪙 <strong>{myBalance ?? '-'}</strong>&nbsp;mes tokens</div>
          )}
          <div className={STAT}>👥 <strong>{employees?.length ?? 0}</strong>&nbsp;employés</div>
          <div className={STAT}>🪙 <strong>{totalDistributed}</strong>&nbsp;tokens distribués</div>
          {role === 'owner' && (
            <button className={INVITE} type="button" onClick={() => handleGenerateInvite('MANAGER')}>
              Code manager
            </button>
          )}
          <button className={INVITE} type="button" onClick={() => handleGenerateInvite('EMPLOYEE')}>
            Code employé
          </button>
        </div>

        {paymentNotice === 'success' && (
          <div className={MSG}>✅ Paiement réussi ! Ton pool va être crédité dans un instant.</div>
        )}
        {paymentNotice === 'cancel' && (
          <div className={`${MSG} ${ERROR}`}>Paiement annulé.</div>
        )}

        {role === 'owner' && (
          <form className={RECHARGE} onSubmit={handleRecharge}>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Nb de tokens"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className={RECHARGE_INPUT}
            />
            <button className={INVITE} type="submit" disabled={recharging}>
              {recharging ? '…' : '💳 Recharger le pool'}
            </button>
            {rechargeError && <p className={`${MSG} ${ERROR}`}>{rechargeError}</p>}
          </form>
        )}

        {role === 'owner' && managers.length > 0 && (
          <section className={HISTORY}>
            <h2 className={HISTORY_TITLE}>Allouer des tokens aux managers</h2>
            <ul className={LIST}>
              {managers.map((m) => (
                <li className={ITEM} key={m.id}>
                  <div className={ROW}>
                    <div className={AVATAR}>
                      {`${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase()}
                    </div>
                    <div className={MAIN}>
                      <div className={NAME}>{m.firstName} {m.lastName}</div>
                      <div className={SUB}>{m.email}</div>
                    </div>
                    <div className={BALANCE}>
                      <div className={BALANCE_NUM}>{m.balance}</div>
                      <div className={BALANCE_LABEL}>tokens</div>
                    </div>
                    <button
                      type="button"
                      className={ACTION_BTN}
                      onClick={() => alloc.toggle(m.id)}
                    >
                      {alloc.openId === m.id ? 'Annuler' : 'Allouer'}
                    </button>
                  </div>
                  {alloc.openId === m.id && (
                    <form
                      className={FORM}
                      onSubmit={(ev) => { ev.preventDefault(); alloc.submit(m.id); }}
                    >
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Montant"
                        value={alloc.amount}
                        onChange={(ev) => alloc.setAmount(ev.target.value)}
                        className={`${INPUT} ${INPUT_NUM}`}
                      />
                      <button type="submit" className={SUBMIT} disabled={alloc.submitting}>
                        {alloc.submitting ? '…' : 'Allouer'}
                      </button>
                      {alloc.error && <p className={`${MSG} ${ERROR}`}>{alloc.error}</p>}
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {inviteCode && (
          <div className={MSG}>
            Code d'invitation : <strong>{inviteCode}</strong>{' '}
            <button
              type="button"
              className={RETRY}
              onClick={() => navigator.clipboard.writeText(inviteCode)}
            >
              Copier
            </button>
          </div>
        )}
        {inviteError && <p className={`${MSG} ${ERROR}`}>{inviteError}</p>}

        {loading && <p className={MSG}>Chargement…</p>}

        {!loading && error && (
          <div className={`${MSG} ${ERROR}`}>
            {error}{' '}
            <button type="button" className={RETRY} onClick={reload}>Réessayer</button>
          </div>
        )}

        <div id="nav-equipe" className="scroll-mt-20" aria-hidden="true" />

        {!loading && !error && employees && employees.length === 0 && (
          <p className={MSG}>Aucun employé pour l'instant.</p>
        )}

        {!loading && !error && employees && employees.length > 0 && (
          <ul className={LIST}>
            {employees.map((e) => (
              <li className={ITEM} key={e.id}>
                <div className={ROW}>
                  <div className={AVATAR}>{initials(e)}</div>
                  <div className={MAIN}>
                    <div className={NAME}>
                      {e.firstName} {e.lastName}
                      {e.isEmailVerified ? (
                        <span className={`${BADGE} ${BADGE_VERIFIED}`}>✓ vérifié</span>
                      ) : (
                        <button
                          type="button"
                          className={ACTION_BTN}
                          onClick={() => approveEmployee(e.id)}>
                          Approuver
                        </button>
                      )}
                    </div>
                    <div className={SUB}>{e.email} · inscrit le {formatDate(e.createdAt)}</div>
                  </div>
                  <div className={BALANCE}>
                    <div className={BALANCE_NUM}>{e.balance}</div>
                    <div className={BALANCE_LABEL}>tokens</div>
                  </div>
                  <button
                    type="button"
                    className={ACTION_BTN}
                    onClick={() => attrib.toggle(e.id)}
                  >
                    {attrib.openId === e.id ? 'Annuler' : 'Attribuer'}
                  </button>
                  <button
                    type="button"
                    className={DELETE_BTN}
                    title="Supprimer cet employé"
                    disabled={deletingId === e.id}
                    onClick={() => handleDelete(e)}
                  >
                    {deletingId === e.id ? '…' : '🗑️'}
                  </button>
                </div>

                {attrib.openId === e.id && (
                  <form
                    className={FORM}
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      attrib.submit(e.id);
                    }}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Montant"
                      value={attrib.amount}
                      onChange={(ev) => attrib.setAmount(ev.target.value)}
                      className={`${INPUT} ${INPUT_NUM}`}
                    />
                    <input
                      type="text"
                      placeholder="Raison (obligatoire)"
                      value={attrib.reason}
                      onChange={(ev) => attrib.setReason(ev.target.value)}
                      className={`${INPUT} ${INPUT_TEXT}`}
                    />
                    <button type="submit" className={SUBMIT} disabled={attrib.submitting}>
                      {attrib.submitting ? '…' : 'Valider'}
                    </button>
                    {attrib.error && <p className={`${MSG} ${ERROR}`}>{attrib.error}</p>}
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && (
          <section className={HISTORY}>
            <h2 className={HISTORY_TITLE}>Historique des transactions</h2>
            {attributions.length === 0 ? (
              <p className={MSG}>Aucune transaction pour l'instant.</p>
            ) : (
              <ul className={HISTORY_LIST}>
                {attributions.map((a) => (
                  <li className={HISTORY_ROW} key={a.id}>
                    <span className={HISTORY_EMP}>
                      {a.employee.firstName} {a.employee.lastName}
                    </span>
                    <span className={HISTORY_REASON}>{a.reason}</span>
                    <span className={HISTORY_DATE}>{formatDate(a.createdAt)}</span>
                    <span className={HISTORY_AMOUNT}>+{a.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {!loading && <EditProfile />}
        <div id="nav-profil" className="scroll-mt-20" />
        {!loading && <PrivacySection onAccountDeleted={onLogout} />}
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
