import { useEffect, useState } from 'react';
import {
  listEmployees,
  getCompany,
  generateInviteCode,
  createCheckout,
  listManagers,
  allocateTokens,
  listSentEnvelopes,
  logout as apiLogout,
} from '../services/api';
import type { CompanyManager } from '../services/api';
import type { Employee, Company } from '../types/types';
import type { RetributionMode, SentEnvelope } from '../types/types';
import Layout from '../components/layout/Layout';
import BottomNav from '../components/layout/BottomNav';
import { NAV_ITEMS } from '../hooks/useBottomNav';
import PrivacySection from '../components/privacy/PrivacySection';
import EditProfile from '../components/privacy/EditProfile';
import { useConfirm } from '../components/ui/ConfirmDialog';
import ModeSelector from '../components/allocation/ModeSelector';
import SentEnvelopeTile from '../components/allocation/SentEnvelopeTile';
import Icon from '../components/ui/Icon';
import Coin from '../components/ui/Coin';
import DashboardHero from '../components/dashboard/DashboardHero';
import Avatar from '../components/dashboard/Avatar';
import {
  DASH_WRAPPER, DASH_CONTAINER, DASH_INVITE, DASH_MSG, DASH_ERROR, DASH_RETRY,
  HISTORY, HISTORY_TITLE, ENV_GRID, EMP_MAIN, EMP_NAME,
  EMP_SUB, EMP_ATTRIB_SUBMIT, EMP_ATTRIB_ERROR, ALLOC_INPUT,
  ALLOC_AMOUNT_CARD, ALLOC_AMOUNT_VALUE,
  ALLOC_CHIPS, ALLOC_CHIP, ALLOC_CHIP_ON, ALLOC_CHIP_OFF, ALLOC_BANNER,
} from '../components/dashboard/dashStyles';

// Montants rapides proposés pour l'allocation d'enveloppe (chips F2).
const ALLOC_QUICK = ['50', '150', '300', '500'];

type Props = { onLogout: () => void; onBack: () => void; onStats?: () => void; firstName?: string | null; profilePhoto?: string | null };

// Dashboard patron : alloue des enveloppes aux managers (avec mode) et suit les
// enveloppes envoyées. La gestion des employés (suppression, etc.) est back-office.
export default function OwnerDashboard({ onLogout, onStats, firstName, profilePhoto }: Props) {
  // Avatar du hero, maj en direct depuis le profil.
  const [heroPhoto, setHeroPhoto] = useState<string | null>(profilePhoto ?? null);
  const heroInitials = (firstName?.[0] ?? '?').toUpperCase();
  const { confirmDialog } = useConfirm();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  // Onglet initial : permet l'arrivée directe depuis /stats (ex. #managers).
  const hashTab = window.location.hash.replace('#', '');
  const [activeTab, setActiveTab] =
    useState<'accueil' | 'managers' | 'profil'>(
      hashTab === 'managers' || hashTab === 'profil' ? hashTab : 'accueil',
    );

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

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, compRes] = await Promise.all([
        listEmployees(),
        getCompany(),
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  // Retour de Stripe : ?payment=success|cancel.
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment === 'success' || payment === 'cancel') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaymentNotice(payment);
      window.history.replaceState({}, '', window.location.pathname);
      if (payment === 'success') setTimeout(() => { load(); }, 1500);
    }
  }, []);

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
      chrome="console"
      hideConsoleMobileHeader
      hideConsoleTopbar
      nav={{
        items: NAV_ITEMS.owner,
        active: activeTab,
        onSelect: (it) => {
          if (it.key === 'stats') { onStats?.(); return; }
          setActiveTab(it.key as typeof activeTab);
        },
      }}
      bottomNav={
        <BottomNav
          items={NAV_ITEMS.owner}
          active={activeTab}
          onSelect={(it) => {
            if (it.key === 'stats') { onStats?.(); return; }
            setActiveTab(it.key as typeof activeTab);
          }}
        />
      }
      sidebarFooter={
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold text-[#6BA8A2] transition hover:bg-white/5 hover:text-primo-error"
        >
          <Icon name="logout" size={16} strokeWidth={1.8} /> Se déconnecter
        </button>
      }
    >
    <div className={DASH_WRAPPER}>
      <div className={DASH_CONTAINER}>

        {/* ── Onglet Accueil : hero pool + recharge + invitations ── */}
        {activeTab === 'accueil' && (
          <>
        {/* Hero : pool entreprise (cf. README F1) */}
        <DashboardHero
          bleed="-mx-4"
          eyebrow="Espace employeur"
          photo={heroPhoto}
          initials={heroInitials}
          title={
            <span className="flex items-center gap-2">
              {company?.name ?? 'Mon entreprise'}
              <span className="rounded-[12px] bg-primo-gold px-2 py-0.5 text-[11px] font-extrabold text-primo-ink-900">OWNER</span>
            </span>
          }
        >
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
        </DashboardHero>

        {paymentNotice === 'success' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-primo-success-soft px-4 py-3 text-[13px] font-semibold text-primo-success">
            <Icon name="check" size={16} strokeWidth={2.2} /> Paiement réussi — ton pool sera crédité dans un instant.
          </div>
        )}
        {paymentNotice === 'cancel' && (
          <div className="mb-4 rounded-xl bg-primo-error-soft px-4 py-3 text-[13px] font-semibold text-primo-error">Paiement annulé.</div>
        )}

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
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

        <div>
        {/* CTA principal : aller allouer aux managers (cf. mockup F1) */}
        <button
          type="button"
          onClick={() => setActiveTab('managers')}
          className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-0 bg-primo-ink-900 px-4 py-3.5 text-[15px] font-bold text-white"
        >
          <Icon name="send" size={19} /> Allouer aux managers
        </button>

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
        </div>
        </div>
          </>
        )}

        {/* ── Onglet Managers : allocation + mode ── */}
        {activeTab === 'managers' && (
          loading ? loader
          : error ? errorNote
          : (
          <section className={HISTORY}>
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('accueil')}
                aria-label="Retour"
                className="flex h-9 w-9 items-center justify-center rounded-full text-primo-ink hover:bg-primo-mint"
              >
                <Icon name="arrow-left" size={22} />
              </button>
              <h2 className={`${HISTORY_TITLE} !mb-0`}>Allouer à un manager</h2>
            </div>
            {managers.length === 0 ? (
              <p className={DASH_MSG}>Aucun manager pour l'instant.</p>
            ) : (() => {
              const selected = managers.find((m) => m.id === allocOpenId) ?? null;
              return (
              <form onSubmit={(ev) => { ev.preventDefault(); if (selected) submitAlloc(selected.id); }}>
                {/* Sélecteur de manager */}
                <label className="mb-2 block text-[13px] font-bold text-primo-slate">Manager</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-[14px] border-[1.5px] border-primo-line bg-white px-4 py-3.5 pr-10 text-[15px] font-semibold text-primo-ink focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] focus:outline-none"
                    value={allocOpenId ?? ''}
                    onChange={(ev) => (ev.target.value ? openAlloc(ev.target.value) : setAllocOpenId(null))}
                  >
                    <option value="" disabled>Choisir un manager…</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} — {m.balance} jetons
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron-down" size={20} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primo-teal" />
                </div>

                {/* Récap du manager choisi : enveloppe actuelle */}
                {selected && (
                  <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-primo-line bg-white px-4 py-3">
                    <Avatar initials={`${selected.firstName?.[0] ?? ''}${selected.lastName?.[0] ?? ''}`.toUpperCase()} />
                    <div className={EMP_MAIN}>
                      <div className={EMP_NAME}>{selected.firstName} {selected.lastName}</div>
                      <div className={EMP_SUB}>Enveloppe actuelle · {selected.balance} jetons</div>
                    </div>
                  </div>
                )}

                {selected && (
                  <div className="mt-5 flex flex-col gap-1">
                    {/* Carte montant : gros affichage + Coin or */}
                    <label className="mb-2 block text-[13px] font-bold text-primo-slate">Montant à allouer</label>
                    <div className={ALLOC_AMOUNT_CARD}>
                      <div className={ALLOC_AMOUNT_VALUE}>
                        <Coin size={38} />
                        <span>{Number(allocAmount) > 0 ? Number(allocAmount) : 0}</span>
                      </div>
                    </div>

                    {/* Saisie libre + chips de montant rapide */}
                    <input
                      className={`${ALLOC_INPUT} mt-3 w-full`} type="number" min="1" step="1"
                      placeholder="Saisir un montant"
                      value={allocAmount}
                      onChange={(ev) => setAllocAmount(ev.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <div className={ALLOC_CHIPS}>
                      {ALLOC_QUICK.map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={`${ALLOC_CHIP} ${allocAmount === q ? ALLOC_CHIP_ON : ALLOC_CHIP_OFF}`}
                          onClick={() => setAllocAmount(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Mode de rétribution */}
                    <div className="mt-4 mb-1 text-[13px] font-bold text-primo-slate">Mode de rétribution</div>
                    <ModeSelector
                      mode={allocMode}
                      percentage={allocPercentage}
                      onModeChange={setAllocMode}
                      onPercentageChange={setAllocPercentage}
                    />

                    {/* Bannière info rétribution (uniquement en POURCENTAGE) */}
                    {allocMode === 'POURCENTAGE' && (
                      <div className={ALLOC_BANNER}>
                        <Icon name="info" size={16} className="mt-0.5 flex-shrink-0" />
                        <span>
                          À chaque distribution de ce manager, {Number(allocPercentage) || 0}% du montant lui
                          sera crédité sur son solde perso (rétribution).
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`${EMP_ATTRIB_SUBMIT} mt-4 w-full justify-center`}
                      disabled={allocSubmitting}
                    >
                      <Icon name="send" size={16} />
                      {allocSubmitting ? '…' : `Allouer ${Number(allocAmount) > 0 ? Number(allocAmount) : 0} jetons`}
                    </button>
                    {allocError && <p className={`${EMP_ATTRIB_ERROR} mt-2`}>{allocError}</p>}
                  </div>
                )}
              </form>
              );
            })()}

            {/* Enveloppes déjà envoyées aux managers (suivi) */}
            <h2 className={`${HISTORY_TITLE} mt-7`}>Mes enveloppes envoyées</h2>
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

        {/* ── Onglet Profil ── */}
        {activeTab === 'profil' && (
          <>
            <EditProfile onPhotoChange={setHeroPhoto} />
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
