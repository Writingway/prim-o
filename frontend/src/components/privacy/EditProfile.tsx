import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getMyProfile, updateMyProfile, forgotPassword } from '../../services/api';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import ProfileAvatar from '../ui/ProfileAvatar';
import { AVATARS, type AvatarKey } from '../../lib/avatars';

// Employee profile (see README B4): avatar header + badges, then expandable settings
// rows (accordion, same pattern as the "Confidentialité & données" section).
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
// Expandable panel under a row (same style as PrivacySection).
const PANEL = 'mt-2.5 rounded-2xl border border-primo-line bg-white px-4 py-4';

type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  isEmailVerified: boolean;
  profilePhoto: string | null;
};

// Which profile row is expanded (only one at a time).
type OpenSection = 'profile' | 'password' | null;

function AccordionRow({
  icon,
  label,
  open,
  onClick,
}: {
  icon: IconName;
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button className={ROW} type="button" onClick={onClick} aria-expanded={open}>
      <span className={ROW_ICON}>
        <Icon name={icon} size={19} />
      </span>
      <span className="flex-1 text-[15px] font-semibold text-primo-ink">{label}</span>
      <Icon
        name="chevron-down"
        size={20}
        className={`flex-none text-primo-muted transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

type EditProfileProps = {
  // Lets the dashboard hero refresh its avatar immediately after saving.
  onPhotoChange?: (photo: string | null) => void;
};

export default function EditProfile({ onPhotoChange }: EditProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  // Avatar picked in the edit form (only persisted when saving).
  const [editPhoto, setEditPhoto] = useState<AvatarKey | null>(null);

  // Form fields, pre-filled when the panel opens.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pwdSending, setPwdSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await getMyProfile();
    if (res.ok && res.data) setProfile(res.data.profile);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  // Toggle the edit form; on open, pre-fill the fields from the current profile.
  const toggleProfile = () => {
    if (openSection === 'profile') {
      setOpenSection(null);
      return;
    }
    if (!profile) return;
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setEmail(profile.email);
    setEditPhoto((profile.profilePhoto as AvatarKey | null) ?? null);
    setError('');
    setOpenSection('profile');
  };

  // Toggle the password panel (the reset email is only sent on the explicit button click).
  const togglePassword = () => {
    setOpenSection((s) => (s === 'password' ? null : 'password'));
  };

  const handleSave = async () => {
    if (!profile) return;

    // Send ONLY the fields that actually changed (partial update).
    const payload: { firstName?: string; lastName?: string; email?: string; profilePhoto?: string | null } = {};
    if (firstName !== (profile.firstName ?? '')) payload.firstName = firstName;
    if (lastName !== (profile.lastName ?? '')) payload.lastName = lastName;
    if (email !== profile.email) payload.email = email;
    if (editPhoto !== (profile.profilePhoto ?? null)) payload.profilePhoto = editPhoto;

    if (Object.keys(payload).length === 0) {
      setOpenSection(null); // nothing changed: just close the panel
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await updateMyProfile(payload);
      if (res.ok && res.data && 'profile' in res.data) {
        setProfile(res.data.profile);
        setOpenSection(null);
        onPhotoChange?.(res.data.profile.profilePhoto);
        toast.success(
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

  // Password change goes through the same flow as "forgot password" (emailed link).
  // The password is never changed directly here.
  const handlePasswordReset = async () => {
    if (!profile) return;
    setPwdSending(true);
    try {
      const res = await forgotPassword(profile.email);
      if (!res.ok) {
        toast.error("Impossible d'envoyer l'email de réinitialisation. Réessaie.");
        return;
      }
      toast.success("Un email de réinitialisation t'a été envoyé. Vérifie ta boîte mail.");
    } catch {
      toast.error('Impossible de joindre le serveur.');
    } finally {
      setPwdSending(false);
    }
  };

  if (loading || !profile) {
    return (
      <section className={`${CARD} mb-3.5 p-5`} aria-busy="true">
        {/* Avatar header skeleton. */}
        <div className="flex flex-col items-center pb-1">
          <div className="h-[78px] w-[78px] rounded-full bg-primo-line animate-pulse" />
          <div className="mt-3.5 h-5 w-40 rounded bg-primo-line animate-pulse" />
          <div className="mt-2 h-4 w-52 rounded bg-primo-line animate-pulse" />
          <div className="mt-3 h-7 w-28 rounded-[20px] bg-primo-line animate-pulse" />
        </div>
        {/* Two settings-row skeletons. */}
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="h-[58px] rounded-2xl bg-primo-line animate-pulse" />
          <div className="h-[58px] rounded-2xl bg-primo-line animate-pulse" />
        </div>
      </section>
    );
  }

  const initials =
    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() ||
    profile.email[0]?.toUpperCase() ||
    '?';
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Mon profil';

  return (
    <section className="mb-3.5">
      {/* Profile header (always visible). */}
      <div className="mb-4 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={toggleProfile}
          className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primo-teal focus-visible:ring-offset-2"
          aria-label="Modifier mon profil"
        >
          <ProfileAvatar
            photo={profile.profilePhoto}
            initials={initials}
            size={78}
            className="shadow-[0_14px_30px_-10px_rgba(0,130,124,0.6)]"
          />
          <span className="absolute bottom-0 right-0 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primo-teal text-white ring-2 ring-white">
            <Icon name="settings" size={13} />
          </span>
        </button>
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

      {/* Settings rows (accordion). */}
      <div className="flex flex-col gap-2.5">
        {/* Edit-profile section. */}
        <div>
          <AccordionRow
            icon="settings"
            label="Modifier mon profil"
            open={openSection === 'profile'}
            onClick={toggleProfile}
          />
          {openSection === 'profile' && (
            <div className={PANEL}>
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

                {/* Profile photo: predefined avatars, or initials as fallback. */}
                <div className={FIELD}>
                  <label className={LABEL}>Photo de profil</label>
                  <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                    {AVATARS.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => setEditPhoto(a.key)}
                        className={`relative rounded-full transition ${
                          editPhoto === a.key ? 'ring-2 ring-primo-teal ring-offset-2' : 'hover:opacity-90'
                        }`}
                        aria-label={`Avatar ${a.key}`}
                      >
                        <ProfileAvatar photo={a.key} size={52} className="w-full" />
                        {editPhoto === a.key && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primo-teal text-white ring-2 ring-white">
                            <Icon name="check" size={12} strokeWidth={2.6} />
                          </span>
                        )}
                      </button>
                    ))}
                    {/* Back to initials (no avatar). */}
                    <button
                      type="button"
                      onClick={() => setEditPhoto(null)}
                      className={`rounded-full transition ${
                        !editPhoto ? 'ring-2 ring-primo-teal ring-offset-2' : 'hover:opacity-90'
                      }`}
                      aria-label="Initiales (aucun avatar)"
                    >
                      <ProfileAvatar photo={null} initials={initials} size={52} className="w-full" />
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap gap-2.5">
                  <button className={BTN_PRIMARY} type="button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button className={BTN_SECONDARY} type="button" onClick={() => setOpenSection(null)} disabled={saving}>
                    Annuler
                  </button>
                </div>
                {error && <p className="mt-1 text-[13px] text-primo-error">{error}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Password section. */}
        <div>
          <AccordionRow
            icon="lock"
            label="Mot de passe"
            open={openSection === 'password'}
            onClick={togglePassword}
          />
          {openSection === 'password' && (
            <div className={PANEL}>
              <p className="mb-3 text-[13px] text-primo-gray">
                Pour changer ton mot de passe, on t'envoie un lien de réinitialisation
                sécurisé par email. Tu choisiras ton nouveau mot de passe depuis ce lien.
              </p>
              <button className={BTN_PRIMARY} type="button" onClick={handlePasswordReset} disabled={pwdSending}>
                {pwdSending ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
