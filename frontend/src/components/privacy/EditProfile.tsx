import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, forgotPassword } from '../../services/api';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';

// Profil employé (cf. README B4) : en-tête avatar + badges, puis lignes de réglages.
const CARD = 'rounded-2xl border border-primo-line bg-white';
const FIELD = 'flex flex-col gap-[5px]';
const LABEL = 'text-[13px] font-semibold text-primo-slate';
const INPUT =
  'w-full rounded-[13px] border-[1.5px] border-primo-line bg-white px-3.5 py-3 text-[15px] font-medium text-primo-ink transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] focus:outline-none';
const BTN =
  'rounded-[13px] px-4 py-3 text-sm font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_PRIMARY = `${BTN} border-0 bg-primo-teal text-white hover:bg-primo-teal-strong`;
const BTN_SECONDARY = `${BTN} border-[1.5px] border-primo-line bg-white text-primo-slate hover:bg-primo-surface`;
const ROW =
  'flex w-full items-center gap-3 rounded-2xl border border-primo-line bg-white px-4 py-3.5 text-left transition hover:bg-primo-surface';
const ROW_ICON =
  'flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primo-mint text-primo-teal-strong';

type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  isEmailVerified: boolean;
};

function Row({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button className={ROW} type="button" onClick={onClick}>
      <span className={ROW_ICON}>
        <Icon name={icon} size={19} />
      </span>
      <span className="flex-1 text-[15px] font-semibold text-primo-ink">{label}</span>
      <Icon name="chevron-right" size={20} className="flex-none text-primo-muted" />
    </button>
  );
}

export default function EditProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Champs du formulaire (pré-remplis à l'ouverture).
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await getMyProfile();
    if (res.ok && res.data) setProfile(res.data.profile);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = () => {
    if (!profile) return;
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setEmail(profile.email);
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    // On n'envoie QUE les champs réellement modifiés (mise à jour partielle).
    const payload: { firstName?: string; lastName?: string; email?: string } = {};
    if (firstName !== (profile.firstName ?? '')) payload.firstName = firstName;
    if (lastName !== (profile.lastName ?? '')) payload.lastName = lastName;
    if (email !== profile.email) payload.email = email;

    if (Object.keys(payload).length === 0) {
      setEditing(false); // rien n'a changé → on referme simplement
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await updateMyProfile(payload);
      if (res.ok && res.data && 'profile' in res.data) {
        setProfile(res.data.profile);
        setEditing(false);
        setSuccess(
          payload.email
            ? 'Profil mis à jour. Ton nouvel email devra être vérifié.'
            : 'Profil mis à jour.',
        );
        return;
      }
      if (res.status === 409) {
        setError('Cet email est déjà utilisé.');
        return;
      }
      setError('La mise à jour a échoué. Vérifie les champs (2 caractères minimum).');
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  };

  // Changement de mot de passe : on passe par le même flux que « oublié »
  // (lien par mail). On ne modifie jamais le mot de passe en direct ici.
  const handlePasswordReset = async () => {
    if (!profile) return;
    setPwdMsg('');
    await forgotPassword(profile.email);
    setPwdMsg("Un email de réinitialisation t'a été envoyé. Vérifie ta boîte mail.");
  };

  if (loading || !profile) return null;

  const initials =
    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() ||
    profile.email[0]?.toUpperCase() ||
    '?';
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Mon profil';

  if (editing) {
    return (
      <section className={`${CARD} mb-3.5 p-5`}>
        <h2 className="mb-4 text-base font-bold text-primo-ink">Modifier mon profil</h2>
        <div className="flex flex-col gap-3">
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-firstName">Prénom</label>
            <input id="edit-firstName" className={INPUT} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-lastName">Nom</label>
            <input id="edit-lastName" className={INPUT} type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-email">Email</label>
            <input id="edit-email" className={INPUT} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <button className={BTN_PRIMARY} type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button className={BTN_SECONDARY} type="button" onClick={() => setEditing(false)} disabled={saving}>
              Annuler
            </button>
          </div>
          {error && <p className="mt-1 text-[13px] text-primo-error">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-3.5">
      {/* En-tête profil */}
      <div className="mb-4 flex flex-col items-center text-center">
        <span
          className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-gradient-to-br from-primo-teal-100 to-primo-teal-strong text-[28px] font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(0,130,124,0.6)]"
          aria-hidden
        >
          {initials}
        </span>
        <div className="mt-3.5 text-[21px] font-extrabold text-primo-ink">{fullName}</div>
        <div className="break-all text-sm text-primo-slate-soft">{profile.email}</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {profile.isEmailVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-primo-success-soft px-3 py-1.5 text-xs font-bold text-primo-success">
              <Icon name="check" size={14} strokeWidth={2.4} />
              E-mail vérifié
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-primo-warn-soft px-3 py-1.5 text-xs font-bold text-primo-warn-strong">
              <Icon name="alert" size={14} strokeWidth={2} />
              E-mail non vérifié
            </span>
          )}
        </div>
      </div>

      {/* Lignes de réglages */}
      <div className="flex flex-col gap-2.5">
        <Row icon="settings" label="Modifier mon profil" onClick={startEdit} />
        <Row icon="lock" label="Mot de passe" onClick={handlePasswordReset} />
      </div>
      {success && <p className="mt-2.5 text-[13px] text-primo-success">{success}</p>}
      {pwdMsg && <p className="mt-2.5 text-[13px] text-primo-success">{pwdMsg}</p>}
    </section>
  );
}
