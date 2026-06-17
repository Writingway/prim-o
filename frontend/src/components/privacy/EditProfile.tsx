import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../../services/api';
import './privacy.css';

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

  if (loading || !profile) return null;

  return (
    <section className="emp-dash-section">
      <h2 className="emp-dash-section-title">Mon profil</h2>

      {!editing ? (
        <>
          <div className="priv-profile">
            <div className="priv-profile-identity">
              <div className="priv-profile-name">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="priv-profile-email">
                {profile.email}
                {!profile.isEmailVerified && (
                  <span className="priv-badge-unverified">email non vérifié</span>
                )}
              </div>
            </div>
            <button className="priv-btn priv-btn-secondary" type="button" onClick={startEdit}>
              Modifier
            </button>
          </div>
          {success && <p className="priv-msg-success">{success}</p>}
        </>
      ) : (
        <div className="priv-form">
          <div className="priv-field">
            <label htmlFor="edit-firstName">Prénom</label>
            <input
              id="edit-firstName"
              className="priv-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="priv-field">
            <label htmlFor="edit-lastName">Nom</label>
            <input
              id="edit-lastName"
              className="priv-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="priv-field">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              className="priv-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="priv-actions">
            <button className="priv-btn priv-btn-primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              className="priv-btn priv-btn-secondary"
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Annuler
            </button>
          </div>
          {error && <p className="priv-msg-error">{error}</p>}
        </div>
      )}
    </section>
  );
}
