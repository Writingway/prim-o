import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { resetPassword } from '../services/api';
import './AuthPage.css';

type ResetPasswordPageProps = {
  token: string;
  onDone: () => void; // quitter la page (retour connexion)
};

// Page atteinte via le lien reçu par mail (…/?reset-token=…). L'utilisateur
// y choisit un nouveau mot de passe ; le token est consommé côté backend.
export default function ResetPasswordPage({ token, onDone }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res.ok) {
        setSuccess(true);
        return;
      }
      if (res.status === 400) {
        setError(res.data?.error || 'Lien de réinitialisation invalide ou expiré.');
        return;
      }
      setError('Une erreur est survenue.');
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-logo">Prim'O</h1>

        {success ? (
          <>
            <p className="auth-success">Mot de passe réinitialisé ✅ Tu peux te connecter.</p>
            <button type="button" onClick={onDone}>Aller à la connexion</button>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirme le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Chargement…' : 'Réinitialiser'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
