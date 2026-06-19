import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, forgotPassword } from '../../services/api';

const BTN =
  'rounded-lg border border-transparent px-4 py-[9px] text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_PRIMARY = `${BTN} bg-primo-teal text-white hover:bg-primo-teal-dark`;
const BTN_SECONDARY = `${BTN} border-[#d1d5db] bg-white text-[#4b5563] hover:bg-[#f9fafb]`;
const FIELD = 'flex flex-col gap-[5px]';
const LABEL = 'text-xs font-semibold text-primo-gray';
const INPUT =
  'w-full rounded-lg border border-[#d1d5db] px-3 py-[9px] text-sm text-[#1f2937] transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)] focus:outline-none';

type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  isEmailVerified: boolean;
};

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

  return (
    <section className="emp-dash-section">
      <h2 className="emp-dash-section-title">Mon profil</h2>

      {!editing ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#ececf1] bg-[#fafafb] px-3.5 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1f2937]">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="mt-0.5 break-all text-xs text-primo-gray">
                {profile.email}
                {!profile.isEmailVerified && (
                  <span className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-[#fef3c7] px-[7px] py-px text-[11px] font-semibold text-[#b45309]">
                    email non vérifié
                  </span>
                )}
              </div>
            </div>
            <button className={BTN_SECONDARY} type="button" onClick={startEdit}>
              Modifier
            </button>
          </div>
          {success && <p className="mt-2.5 text-[13px] text-primo-success">{success}</p>}

          <div className="mt-3">
            <button className={BTN_SECONDARY} type="button" onClick={handlePasswordReset}>
              Modifier mon mot de passe
            </button>
            {pwdMsg && <p className="mt-2.5 text-[13px] text-primo-success">{pwdMsg}</p>}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-firstName">Prénom</label>
            <input
              id="edit-firstName"
              className={INPUT}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-lastName">Nom</label>
            <input
              id="edit-lastName"
              className={INPUT}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className={FIELD}>
            <label className={LABEL} htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              className={INPUT}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button className={BTN_PRIMARY} type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              className={BTN_SECONDARY}
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Annuler
            </button>
          </div>
          {error && <p className="mt-1 text-[13px] text-primo-error">{error}</p>}
        </div>
      )}
    </section>
  );
}
