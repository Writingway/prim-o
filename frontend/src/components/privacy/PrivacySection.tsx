import { useState } from 'react';
import { exportMyData, deleteMyAccount } from '../../services/api';
import Icon from '../ui/Icon';

// Ligne-bouton dépliable (même style que les réglages du profil).
const ROW =
  'flex w-full items-center gap-3 rounded-2xl border border-primo-line bg-white px-4 py-3.5 text-left transition hover:bg-primo-surface';
const ROW_ICON =
  'flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primo-mint text-primo-teal-strong';
const PANEL = 'mt-2.5 rounded-2xl border border-primo-line bg-white px-[18px] py-5';
const BTN =
  'rounded-[13px] border border-transparent px-4 py-3 text-sm font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_PRIMARY = `${BTN} bg-primo-teal text-white hover:bg-primo-teal-strong`;
const BTN_SECONDARY = `${BTN} border-[1.5px] border-primo-line bg-white text-primo-slate hover:bg-primo-surface`;
const BTN_DANGER = `${BTN} border-[1.5px] border-primo-error-line bg-white text-primo-error hover:bg-primo-error-soft`;
const BTN_DANGER_SOLID = `${BTN} bg-primo-error text-white hover:brightness-95`;

type PrivacySectionProps = {
  // Appelé après une suppression réussie : le parent doit clore la session
  // (vider le token, revenir à l'accueil) - le compte n'existe plus.
  onAccountDeleted: () => void;
};

export default function PrivacySection({ onAccountDeleted }: PrivacySectionProps) {
  const [open, setOpen] = useState(false);
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
    <div className="mb-3.5">
      {/* Bouton dépliable */}
      <button type="button" className={ROW} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={ROW_ICON}>
          <Icon name="shield" size={19} />
        </span>
        <span className="flex-1 text-[15px] font-semibold text-primo-ink">Confidentialité &amp; données</span>
        <Icon
          name="chevron-down"
          size={20}
          className={`flex-none text-primo-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
      <div className={PANEL}>

      {/* Export (RGPD art. 15 & 20) */}
      <p className="mb-3 text-[13px] text-primo-gray">
        Tu peux télécharger l'ensemble des données que nous détenons sur toi.
      </p>
      <button className={BTN_PRIMARY} type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? 'Préparation…' : 'Télécharger mes données'}
      </button>
      {exportError && <p className="mt-1 text-[13px] text-primo-error">{exportError}</p>}

      <hr className="my-[18px] border-0 border-t border-primo-line" />

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
            <label className="text-[13px] font-semibold text-primo-slate" htmlFor="confirm-pwd">Confirme avec ton mot de passe</label>
            <input
              id="confirm-pwd"
              className="w-full rounded-[13px] border-[1.5px] border-primo-line px-3.5 py-3 text-sm text-primo-ink transition focus:border-primo-teal focus:shadow-[0_0_0_3px_rgba(0,161,154,0.12)] focus:outline-none"
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
      </div>
      )}
    </div>
  );
}
