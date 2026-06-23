import { useEffect, useState } from 'react';
import {
  listEmployees,
  getCompany,
  listAttributions,
  deleteEmployee,
  generateInviteCode,
  createAttribution,
  approveEmployee as apiApproveEmployee,
  createCheckout,
  listManagers,
  allocateTokens,
  listMotifs,
  listSentEnvelopes,
  logout as apiLogout,
} from '../services/api';
import type { CompanyManager } from '../services/api';
import type { Employee, Company, AttributionHistory } from '../types/types';
import type { RetributionMode, MotifCategoryGroup, SentEnvelope } from '../types/types';
import { formatDate } from '../lib/format';
import Layout from '../components/layout/Layout';
import BottomNav from '../components/layout/BottomNav';
import { NAV_ITEMS } from '../hooks/useBottomNav';
import PrivacySection from '../components/privacy/PrivacySection';
import EditProfile from '../components/privacy/EditProfile';
import { useConfirm } from '../components/ui/ConfirmDialog';
import ModeSelector from '../components/allocation/ModeSelector';
import MotifSelect from '../components/allocation/MotifSelect';
import SentEnvelopeTile from '../components/allocation/SentEnvelopeTile';
import DashHistory from '../components/dashboard/DashHistory';
import Icon from '../components/ui/Icon';
import Coin from '../components/ui/Coin';
import { HEADER_BTN_GHOST } from '../components/layout/headerButtons';
import Avatar from '../components/dashboard/Avatar';
import {
  DASH_WRAPPER, DASH_CONTAINER, DASH_INVITE, DASH_MSG, DASH_ERROR, DASH_RETRY,
  HISTORY, HISTORY_TITLE, ENV_GRID, EMP_LIST, EMP_ITEM, EMP_ROW, EMP_MAIN, EMP_NAME,
  EMP_SUB, EMP_BADGE, EMP_BADGE_VERIFIED, EMP_ATTRIB_BTN, EMP_ATTRIB_FORM,
  EMP_ATTRIB_SUBMIT, EMP_ATTRIB_ERROR, EMP_BALANCE, EMP_BALANCE_NUM, EMP_BALANCE_LABEL,
  EMP_DELETE_BTN, ALLOC_INPUT,
} from '../components/dashboard/dashStyles';

type Props = { onLogout: () => void; onBack: () => void; onStats?: () => void };

const initials = (e: Employee) =>
  `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase();

// Dashboard patron : alloue des enveloppes aux managers (avec mode), suit les
// enveloppes envoyées, et distribue en direct à ses employés (montant + motif).
export default function OwnerDashboard({ onLogout, onStats }: Props) {
  const { confirm, confirmDialog } = useConfirm();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [attributions, setAttributions] = useState<AttributionHistory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  const [activeTab, setActiveTab] =
    useState<'accueil' | 'managers' | 'envoyees' | 'employes' | 'profil'>('accueil');
  const [motifGroups, setMotifGroups] = useState<MotifCategoryGroup[]>([]);

  // Recharge du pool via Stripe.
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<'success' | 'cancel' | null>(null);

  // Managers + enveloppes envoyées.
  const [managers, setManagers] = useState<CompanyManager[]>([]);
  const [sentEnvelopes, setSentEnvelopes] = useState<SentEnvelope[]>([]);
  const [allocOpenId, setAllocOpenId] = useState<string | null>(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [allocMode, setAllocMode] = useState<RetributionMode>('PART_EGALE');
  const [allocPercentage, setAllocPercentage] = useState('');
  const [allocError, setAllocError] = useState('');
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  // Envoi direct → employé (montant + motif).
  const [attribOpenId, setAttribOpenId] = useState<string | null>(null);
  const [attribAmount, setAttribAmount] = useState('');
  const [attribMotif, setAttribMotif] = useState('');
  const [attribError, setAttribError] = useState('');
  const [attribSubmitting, setAttribSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, compRes, attrRes, motifRes] = await Promise.all([
        listEmployees(),
        getCompany(),
        listAttributions(),
        listMotifs(),
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
      if (motifRes.ok && motifRes.data) setMotifGroups(motifRes.data.categories);

      const [mgrRes, sentRes] = await Promise.all([listManagers(), listSentEnvelopes()]);
      if (mgrRes.ok && mgrRes.data) setManagers(mgrRes.data.managers);
      if (sentRes.ok && sentRes.data) setSentEnvelopes(sentRes.data.envelopes);
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retour de Stripe : ?payment=success|cancel.
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment === 'success' || payment === 'cancel') {
      setPaymentNotice(payment);
      window.history.replaceState({}, '', window.location.pathname);
      if (payment === 'success') setTimeout(() => { load(); }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (res.ok) await load();
      else setError("Impossible de supprimer cet employé.");
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
      // déconnexion front même si l'appel échoue
    }
    onLogout();
  };

  const handleGenerateInvite = async (inviteRole: 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE') => {
    setInviteError('');
    try {
      const res = await generateInviteCode(inviteRole);
      if (res.ok && res.data?.invite) setInviteCode(res.data.invite.code);
      else if (res.status === 401) setInviteError('Session expirée, reconnecte-toi.');
      else setInviteError("Impossible de générer le code d'invitation.");
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
      if (res.ok && res.data?.url) window.location.href = res.data.url;
      else if (res.status === 401) setRechargeError('Session expirée, reconnecte-toi.');
      else setRechargeError('Impossible de démarrer le paiement.');
    } catch {
      setRechargeError('Impossible de joindre le serveur.');
    } finally {
      setRecharging(false);
    }
  };

  const openAlloc = (id: string) => {
    setAllocOpenId(id);
    setAllocAmount('');
    setAllocMode('PART_EGALE');
    setAllocPercentage('');
    setAllocError('');
  };

  const submitAlloc = async (managerId: string) => {
    setAllocError('');
    const amount = Number(allocAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setAllocError('Le montant doit être un entier positif.');
      return;
    }
    let percentage: number | undefined;
    if (allocMode === 'POURCENTAGE') {
      percentage = Number(allocPercentage);
      if (!Number.isInteger(percentage) || percentage < 1 || percentage > 100) {
        setAllocError('Le pourcentage doit être un entier entre 1 et 100.');
        return;
      }
    }
    setAllocSubmitting(true);
    try {
      const res = await allocateTokens(managerId, amount, allocMode, percentage);
      if (res.ok) {
        setAllocOpenId(null);
        await load();
      } else if (res.status === 401) {
        setAllocError('Session expirée, reconnecte-toi.');
      } else {
        const msg = res.data && 'error' in res.data ? res.data.error : "Échec de l'allocation.";
        setAllocError(msg);
      }
    } catch {
      setAllocError('Impossible de joindre le serveur.');
    } finally {
      setAllocSubmitting(false);
    }
  };

  const openAttrib = (id: string) => {
    setAttribOpenId(id);
    setAttribAmount('');
    setAttribMotif('');
    setAttribError('');
  };

  const closeAttrib = () => {
    setAttribOpenId(null);
    setAttribError('');
  };

  const submitAttrib = async (employeeId: string) => {
    setAttribError('');
    const amount = Number(attribAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setAttribError('Le montant doit être un entier positif.');
      return;
    }
    if (!attribMotif) {
      setAttribError('Le motif est obligatoire.');
      return;
    }
    setAttribSubmitting(true);
    try {
      const res = await createAttribution({ employeeId, amount, motifId: attribMotif });
      if (res.ok) {
        closeAttrib();
        await load();
      } else if (res.status === 409) {
        const msg = res.data && 'error' in res.data ? res.data.error : 'Solde de tokens insuffisant.';
        setAttribError(msg);
      } else if (res.status === 401) {
        setAttribError('Session expirée, reconnecte-toi.');
      } else {
        const msg = res.data && 'error' in res.data ? res.data.error : "Échec de l'attribution.";
        setAttribError(msg);
      }
    } catch {
      setAttribError('Impossible de joindre le serveur.');
    } finally {
      setAttribSubmitting(false);
    }
  };

  const approveEmployee = async (employeeId: string) => {
    try {
      const res = await apiApproveEmployee(employeeId);
      if (res.ok) await load();
      else if (res.status === 401) setError('Session expirée, reconnecte-toi.');
      else setError("Impossible d'approuver cet employé.");
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  const totalDistributed = (employees ?? []).reduce((sum, e) => sum + e.balance, 0);

  const loader = <p className={DASH_MSG}>Chargement…</p>;
  const errorNote = (
    <div className={`${DASH_MSG} ${DASH_ERROR}`}>
      {error}{' '}
      <button type="button" className={DASH_RETRY} onClick={load}>Réessayer</button>
    </div>
  );

  return (
    <Layout
      title="Prim'O — Espace patron"
      chrome="app"
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.owner}
          active={activeTab}
          onSelect={(it) => setActiveTab(it.key as typeof activeTab)}
        />
      }
      headerActions={
        <>
          {onStats && (
            <button className={HEADER_BTN_GHOST} type="button" onClick={onStats}>Statistiques</button>
          )}
          <button className={HEADER_BTN_GHOST} type="button" onClick={handleLogout}>Se déconnecter</button>
        </>
      }
    >
    <div className={DASH_WRAPPER}>
      <div className={DASH_CONTAINER}>

        {/* ── Onglet Accueil : hero pool + recharge + invitations ── */}
        {activeTab === 'accueil' && (
          <>
        {/* Hero : pool entreprise (cf. README F1) */}
        <div className="-mx-4 -mt-5 mb-4 overflow-hidden bg-gradient-to-b from-primo-hero-from to-primo-ink-900 px-5 pb-6 pt-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-white/65">Espace employeur</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-[-0.02em]">{company?.name ?? 'Mon entreprise'}</span>
                <span className="rounded-[12px] bg-primo-gold px-2 py-0.5 text-[11px] font-extrabold text-primo-ink-900">OWNER</span>
              </div>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
              <Icon name="users" size={21} />
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.09] p-4">
            <div className="mb-2 flex items-center gap-2 text-white/65">
              <Icon name="envelope" size={18} />
              <span className="text-[13px] font-semibold">Pool entreprise</span>
            </div>
            <div className="flex items-end gap-2.5">
              <Coin size={40} />
              <span className="text-[44px] font-extrabold leading-none tracking-[-0.03em]">{company?.tokenBalance ?? '—'}</span>
            </div>
            <div className="mt-1.5 text-[13px] text-white/65">jetons disponibles à allouer</div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/[0.06] p-3.5 text-center">
              <div className="text-xl font-extrabold">{managers.length}</div>
              <div className="text-[11px] text-white/65">managers</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-3.5 text-center">
              <div className="text-xl font-extrabold">{employees?.length ?? 0}</div>
              <div className="text-[11px] text-white/65">employés</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-3.5 text-center">
              <div className="text-xl font-extrabold">{totalDistributed}</div>
              <div className="text-[11px] text-white/65">distribués</div>
            </div>
          </div>
        </div>

        {paymentNotice === 'success' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-primo-success-soft px-4 py-3 text-[13px] font-semibold text-primo-success">
            <Icon name="check" size={16} strokeWidth={2.2} /> Paiement réussi — ton pool sera crédité dans un instant.
          </div>
        )}
        {paymentNotice === 'cancel' && (
          <div className="mb-4 rounded-xl bg-primo-error-soft px-4 py-3 text-[13px] font-semibold text-primo-error">Paiement annulé.</div>
        )}

        {/* Recharge du pool (Stripe) */}
        <div className="mb-4 rounded-2xl border border-primo-line bg-white p-4">
          <div className="mb-3 text-sm font-bold text-primo-ink">Recharger le pool</div>
          <form className="flex flex-wrap items-center gap-2.5" onSubmit={handleRecharge}>
            <input
              className="w-[150px] flex-1 rounded-[13px] border-[1.5px] border-primo-line bg-primo-surface px-3.5 py-3 text-[15px] font-bold text-primo-ink focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] focus:outline-none"
              type="number" min="1" step="1" placeholder="Nb de jetons"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
            />
            <button
              className="inline-flex items-center gap-2 rounded-[13px] border-0 bg-primo-teal px-4 py-3 text-sm font-bold text-white shadow-[0_10px_22px_-8px_rgba(0,161,154,0.55)] transition hover:bg-primo-teal-strong disabled:opacity-60"
              type="submit" disabled={recharging}
            >
              <Icon name="card" size={18} /> {recharging ? '…' : 'Payer'}
            </button>
          </form>
          <div className="mt-2.5 flex gap-2">
            {['1000', '5000', '10000'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRechargeAmount(p)}
                className={`flex-1 rounded-[10px] px-2 py-2 text-xs font-bold transition ${
                  rechargeAmount === p
                    ? 'bg-primo-teal text-white'
                    : 'border border-primo-line bg-primo-surface text-primo-slate hover:bg-primo-mint'
                }`}
              >
                +{Number(p).toLocaleString('fr-FR')}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-primo-muted">
            <Icon name="lock" size={14} />
            <span className="text-[11.5px]">Paiement sécurisé par Stripe</span>
          </div>
          {rechargeError && <p className="mt-2 text-[13px] text-primo-error">{rechargeError}</p>}
        </div>

        {/* Invitations */}
        <div className="mb-2 flex flex-wrap gap-2.5">
          <button className={DASH_INVITE} type="button" onClick={() => handleGenerateInvite('MANAGER')}>
            <Icon name="plus" size={16} /> Code manager
          </button>
          <button className={DASH_INVITE} type="button" onClick={() => handleGenerateInvite('EMPLOYEE')}>
            <Icon name="plus" size={16} /> Code employé
          </button>
        </div>

        {inviteCode && (
          <div className={DASH_MSG}>
            Code d'invitation : <strong>{inviteCode}</strong>{' '}
            <button type="button" className={DASH_RETRY} onClick={() => navigator.clipboard.writeText(inviteCode)}>Copier</button>
          </div>
        )}
        {inviteError && <p className={`${DASH_MSG} ${DASH_ERROR}`}>{inviteError}</p>}
          </>
        )}

        {/* ── Onglet Managers : allocation + mode ── */}
        {activeTab === 'managers' && (
          loading ? loader
          : error ? errorNote
          : (
          <section className={HISTORY}>
            <h2 className={HISTORY_TITLE}>Allouer des tokens à un manager</h2>
            {managers.length === 0 ? (
              <p className={DASH_MSG}>Aucun manager pour l'instant.</p>
            ) : (
              <ul className={EMP_LIST}>
                {managers.map((m) => (
                  <li className={EMP_ITEM} key={m.id}>
                    <div className={EMP_ROW}>
                      <Avatar initials={`${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase()} />
                      <div className={EMP_MAIN}>
                        <div className={EMP_NAME}>{m.firstName} {m.lastName}</div>
                        <div className={EMP_SUB}>{m.email}</div>
                      </div>
                      <button
                        type="button"
                        className={EMP_ATTRIB_BTN}
                        onClick={() => (allocOpenId === m.id ? setAllocOpenId(null) : openAlloc(m.id))}
                      >
                        {allocOpenId === m.id ? 'Annuler' : 'Attribuer'}
                      </button>
                    </div>
                    {allocOpenId === m.id && (
                      <form className={EMP_ATTRIB_FORM} onSubmit={(ev) => { ev.preventDefault(); submitAlloc(m.id); }}>
                        <input
                          className={ALLOC_INPUT} type="number" min="1" step="1"
                          placeholder="Montant de l'enveloppe"
                          value={allocAmount}
                          onChange={(ev) => setAllocAmount(ev.target.value)}
                        />
                        <ModeSelector
                          mode={allocMode}
                          percentage={allocPercentage}
                          onModeChange={setAllocMode}
                          onPercentageChange={setAllocPercentage}
                        />
                        <button type="submit" className={EMP_ATTRIB_SUBMIT} disabled={allocSubmitting}>
                          {allocSubmitting ? '…' : "Envoyer l'enveloppe"}
                        </button>
                        {allocError && <p className={EMP_ATTRIB_ERROR}>{allocError}</p>}
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          )
        )}

        {/* ── Onglet Envoyées ── */}
        {activeTab === 'envoyees' && (
          loading ? loader
          : error ? errorNote
          : (
          <section className={HISTORY}>
            <h2 className={HISTORY_TITLE}>Mes enveloppes envoyées</h2>
            {sentEnvelopes.length === 0 ? (
              <p className={DASH_MSG}>Aucune enveloppe envoyée pour l'instant.</p>
            ) : (
              <div className={ENV_GRID}>
                {sentEnvelopes.map((e) => <SentEnvelopeTile key={e.allocationId} envelope={e} />)}
              </div>
            )}
          </section>
          )
        )}

        {/* ── Onglet Employés : envoi direct (montant + motif) + historique ── */}
        {activeTab === 'employes' && (
          loading ? loader
          : error ? errorNote
          : (
          <>
            {employees && employees.length === 0 && <p className={DASH_MSG}>Aucun employé pour l'instant.</p>}
            {employees && employees.length > 0 && (
              <ul className={EMP_LIST}>
                {employees.map((e) => (
                  <li className={EMP_ITEM} key={e.id}>
                    <div className={EMP_ROW}>
                      <Avatar initials={initials(e)} />
                      <div className={EMP_MAIN}>
                        <div className={EMP_NAME}>
                          {e.firstName} {e.lastName}
                          {e.isEmailVerified ? (
                            <span className={`${EMP_BADGE} ${EMP_BADGE_VERIFIED}`}><Icon name="check" size={13} strokeWidth={2.4} /> vérifié</span>
                          ) : (
                            <button type="button" className={EMP_ATTRIB_BTN} onClick={() => approveEmployee(e.id)}>Approuver</button>
                          )}
                        </div>
                        <div className={EMP_SUB}>{e.email} · inscrit le {formatDate(e.createdAt)}</div>
                      </div>
                      <div className={EMP_BALANCE}>
                        <div className={EMP_BALANCE_NUM}>{e.balance}</div>
                        <div className={EMP_BALANCE_LABEL}>tokens</div>
                      </div>
                      <button
                        type="button"
                        className={EMP_ATTRIB_BTN}
                        onClick={() => (attribOpenId === e.id ? closeAttrib() : openAttrib(e.id))}
                      >
                        {attribOpenId === e.id ? 'Annuler' : 'Envoyer'}
                      </button>
                      <button
                        type="button"
                        className={EMP_DELETE_BTN}
                        title="Supprimer cet employé"
                        disabled={deletingId === e.id}
                        onClick={() => handleDelete(e)}
                      >
                        {deletingId === e.id ? '…' : <Icon name="trash" size={18} />}
                      </button>
                    </div>

                    {attribOpenId === e.id && (
                      <form className={EMP_ATTRIB_FORM} onSubmit={(ev) => { ev.preventDefault(); submitAttrib(e.id); }}>
                        <input
                          className={ALLOC_INPUT} type="number" min="1" step="1" placeholder="Montant"
                          value={attribAmount}
                          onChange={(ev) => setAttribAmount(ev.target.value)}
                        />
                        <MotifSelect groups={motifGroups} value={attribMotif} onChange={setAttribMotif} />
                        <button type="submit" className={EMP_ATTRIB_SUBMIT} disabled={attribSubmitting}>
                          {attribSubmitting ? '…' : 'Envoyer'}
                        </button>
                        {attribError && <p className={EMP_ATTRIB_ERROR}>{attribError}</p>}
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <DashHistory attributions={attributions} />
          </>
          )
        )}

        {/* ── Onglet Profil ── */}
        {activeTab === 'profil' && (
          <>
            <EditProfile />
            <PrivacySection onAccountDeleted={onLogout} />
            <button
              type="button"
              className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-primo-error-line bg-white px-4 py-3.5 text-[15px] font-bold text-primo-error hover:bg-primo-error-soft lg:hidden"
              onClick={handleLogout}
            >
              <Icon name="logout" size={19} /> Se déconnecter
            </button>
          </>
        )}
      </div>
    </div>
    {confirmDialog}
    </Layout>
  );
}
