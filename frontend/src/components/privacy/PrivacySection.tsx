import { useState } from 'react';
import { exportMyData, deleteMyAccount } from '../../services/api';

const BTN =
  'rounded-lg border border-transparent px-4 py-[9px] text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_PRIMARY = `${BTN} bg-primo-teal text-white hover:bg-primo-teal-dark`;
const BTN_SECONDARY = `${BTN} border-[#d1d5db] bg-white text-[#4b5563] hover:bg-[#f9fafb]`;
const BTN_DANGER = `${BTN} border-[#f0c9c9] bg-white text-primo-error hover:bg-[#fef2f2]`;
const BTN_DANGER_SOLID = `${BTN} bg-primo-error text-white hover:bg-[#b91c1c]`;

type PrivacySectionProps = {
  // Appelé après une suppression réussie : le parent doit clore la session
  // (vider le token, revenir à l'accueil) - le compte n'existe plus.
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
      <p className="mb-3 text-[13px] text-primo-gray">
        Tu peux télécharger l'ensemble des données que nous détenons sur toi.
      </p>
      <button className={BTN_PRIMARY} type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? 'Préparation…' : 'Télécharger mes données'}
      </button>
      {exportError && <p className="mt-1 text-[13px] text-primo-error">{exportError}</p>}

      <hr className="my-[18px] border-0 border-t border-[#ececf1]" />

      {/* Suppression (RGPD art. 17) */}
      <p className="mb-3 text-[13px] text-primo-gray">
        La suppression de ton compte est <strong>définitive</strong> : tes informations
        personnelles seront effacées. Cette action est irréversible.
      </p>

      {!confirming ? (
        <button className={BTN_DANGER} type="button" onClick={() => setConfirming(true)}>
          Supprimer mon compte
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-[5px]">
            <label className="text-xs font-semibold text-primo-gray" htmlFor="confirm-pwd">Confirme avec ton mot de passe</label>
            <input
              id="confirm-pwd"
              className="w-full rounded-lg border border-[#d1d5db] px-3 py-[9px] text-sm text-[#1f2937] transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.15)] focus:outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              className={BTN_DANGER_SOLID}
              type="button"
              onClick={handleDelete}
              disabled={deleting || password.length === 0}
            >
              {deleting ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
            <button
              className={BTN_SECONDARY}
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
          {deleteError && <p className="mt-1 text-[13px] text-primo-error">{deleteError}</p>}
        </div>
      )}
    </section>
  );
}
