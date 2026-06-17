import { useState } from 'react';
import { exportMyData, deleteMyAccount } from '../../services/api';

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
        setExportError("Impossible de récupérer tes données. Réessaie.");
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
      <p className="emp-dash-muted">
        Tu peux télécharger l'ensemble des données que nous détenons sur toi.
      </p>
      <button className="app-btn" type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? 'Préparation…' : 'Télécharger mes données'}
      </button>
      {exportError && <p className="emp-dash-error">{exportError}</p>}

      {/* Suppression (RGPD art. 17) */}
      <hr style={{ margin: '1.5rem 0', opacity: 0.2 }} />
      <p className="emp-dash-muted">
        La suppression de ton compte est <strong>définitive</strong> : tes informations
        personnelles seront effacées. Cette action est irréversible.
      </p>

      {!confirming ? (
        <button className="app-btn" type="button" onClick={() => setConfirming(true)}>
          Supprimer mon compte
        </button>
      ) : (
        <div className="privacy-confirm">
          <label htmlFor="confirm-pwd" className="emp-dash-muted">
            Confirme avec ton mot de passe :
          </label>
          <input
            id="confirm-pwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="privacy-confirm-actions">
            <button
              className="app-btn"
              type="button"
              onClick={handleDelete}
              disabled={deleting || password.length === 0}
            >
              {deleting ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
            <button
              className="app-btn app-btn-ghost"
              type="button"
              onClick={() => { setConfirming(false); setPassword(''); setDeleteError(''); }}
            >
              Annuler
            </button>
          </div>
          {deleteError && <p className="emp-dash-error">{deleteError}</p>}
        </div>
      )}
    </section>
  );
}
