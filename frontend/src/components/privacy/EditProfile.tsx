import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, forgotPassword } from '../../services/api';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import ProfileAvatar from '../ui/ProfileAvatar';
import { AVATARS, type AvatarKey } from '../../lib/avatars';

// Profil employé (cf. README B4) : en-tête avatar + badges, puis lignes de
// réglages dépliables (accordéon, même pattern que « Confidentialité & données »).
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
// Panneau dépliable sous une ligne (même style que PrivacySection).
const PANEL = 'mt-2.5 rounded-2xl border border-primo-line bg-white px-4 py-4';

type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  isEmailVerified: boolean;
  profilePhoto: string | null;
};

// Quelle ligne du profil est dépliée (une seule à la fois).
type OpenSection = 'profile' | 'password' | null;

// Ligne-bouton d'accordéon : chevron qui pivote quand le panneau est ouvert.
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
  // Rafraîchit l'avatar du hero du dashboard en direct après enregistrement.
  onPhotoChange?: (photo: string | null) => void;
};

export default function EditProfile({ onPhotoChange }: EditProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Section dépliée (accordéon). 'profile' = formulaire d'édition, 'password' = reset.
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  // Avatar choisi dans le formulaire d'édition (enregistré avec « Enregistrer »).
  const [editPhoto, setEditPhoto] = useState<AvatarKey | null>(null);

  // Champs du formulaire (pré-remplis à l'ouverture).
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
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

  // Ouvre/ferme le formulaire d'édition. À l'ouverture, pré-remplit les champs.
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
    setSuccess('');
    setOpenSection('profile');
  };

  // Ouvre/ferme le panneau mot de passe (l'email part sur clic explicite du bouton).
  const togglePassword = () => {
    setPwdMsg('');
    setOpenSection((s) => (s === 'password' ? null : 'password'));
  };

  const handleSave = async () => {
    if (!profile) return;

    // On n'envoie QUE les champs réellement modifiés (mise à jour partielle).
    const payload: { firstName?: string; lastName?: string; email?: string; profilePhoto?: string | null } = {};
    if (firstName !== (profile.firstName ?? '')) payload.firstName = firstName;
    if (lastName !== (profile.lastName ?? '')) payload.lastName = lastName;
    if (email !== profile.email) payload.email = email;
    if (editPhoto !== (profile.profilePhoto ?? null)) payload.profilePhoto = editPhoto;

    if (Object.keys(payload).length === 0) {
      setOpenSection(null); // rien n'a changé → on referme simplement
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
    setPwdSending(true);
    setPwdMsg('');
    try {
      await forgotPassword(profile.email);
      setPwdMsg("Un email de réinitialisation t'a été envoyé. Vérifie ta boîte mail.");
    } finally {
      setPwdSending(false);
    }
  };

  if (loading || !profile) return null;

  const initials =
    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() ||
    profile.email[0]?.toUpperCase() ||
    '?';
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Mon profil';

  return (
    <section className="mb-3.5">
      {/* En-tête profil (toujours visible) */}
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

      {/* Lignes de réglages (accordéon) */}
      <div className="flex flex-col gap-2.5">
        {/* ── Modifier mon profil ── */}
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

                {/* Photo de profil : avatars prédéfinis (ou initiales). */}
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
                    {/* Retour aux initiales */}
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

        {/* ── Mot de passe ── */}
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
              {pwdMsg && <p className="mt-2.5 text-[13px] text-primo-success">{pwdMsg}</p>}
            </div>
          )}
        </div>
      </div>
      {success && <p className="mt-2.5 text-[13px] text-primo-success">{success}</p>}
    </section>
  );
}
