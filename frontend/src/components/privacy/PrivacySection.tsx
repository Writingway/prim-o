import { useState } from 'react';
import { exportMyData, deleteMyAccount } from '../../services/api';
import './privacy.css';

type PrivacySectionProps = {
  // Appelé après une suppression réussie : le parent doit clore la session
  // (vider le token, revenir à l'accueil) — le compte n'existe plus.
  onAccountDeleted: () => void;
};

export default function PrivacySection({ onAccountDeleted }: PrivacySectionProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Flux de suppression : confirmation par mot de passe.
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Export : on récupère le JSON puis on le transforme en fichier
  // téléchargeable côté navigateur (Blob + lien temporaire).
  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const res = await exportMyData();
      if (!res.ok || !res.data) {
        setExportError('Impossible de récupérer tes données. Réessaie.');
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-primo.json';
      a.click();
      URL.revokeObjectURL(url); // libère la mémoire du Blob
    } catch {
      setExportError('Impossible de joindre le serveur.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await deleteMyAccount(password);
      if (res.status === 204 || res.ok) {
        onAccountDeleted();
        return;
      }
      if (res.status === 401) {
        setDeleteError('Mot de passe incorrect.');
        return;
      }
      setDeleteError('La suppression a échoué. Réessaie.');
    } catch {
      setDeleteError('Impossible de joindre le serveur.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="emp-dash-section">
      <h2 className="emp-dash-section-title">Mes données personnelles</h2>

      {/* Export (RGPD art. 15 & 20) */}
      <p className="priv-help">
        Tu peux télécharger l'ensemble des données que nous détenons sur toi.
      </p>
      <button className="priv-btn priv-btn-primary" type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? 'Préparation…' : 'Télécharger mes données'}
      </button>
      {exportError && <p className="priv-msg-error">{exportError}</p>}

      <hr className="priv-divider" />

      {/* Suppression (RGPD art. 17) */}
      <p className="priv-help">
        La suppression de ton compte est <strong>définitive</strong> : tes informations
        personnelles seront effacées. Cette action est irréversible.
      </p>

      {!confirming ? (
        <button className="priv-btn priv-btn-danger" type="button" onClick={() => setConfirming(true)}>
          Supprimer mon compte
        </button>
      ) : (
        <div className="priv-form">
          <div className="priv-field">
            <label htmlFor="confirm-pwd">Confirme avec ton mot de passe</label>
            <input
              id="confirm-pwd"
              className="priv-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="priv-actions">
            <button
              className="priv-btn priv-btn-danger-solid"
              type="button"
              onClick={handleDelete}
              disabled={deleting || password.length === 0}
            >
              {deleting ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
            <button
              className="priv-btn priv-btn-secondary"
              type="button"
              onClick={() => {
                setConfirming(false);
                setPassword('');
                setDeleteError('');
              }}
              disabled={deleting}
            >
              Annuler
            </button>
          </div>
          {deleteError && <p className="priv-msg-error">{deleteError}</p>}
        </div>
      )}
    </section>
  );
}
