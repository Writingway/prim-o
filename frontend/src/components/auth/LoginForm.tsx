import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { login, resendVerification, forgotPassword } from '../../services/api';

type LoginFormProps = {
  onLoginSuccess: (accessToken: string) => void;
};

// Formulaire de connexion. À la réussite, remonte le token + rôle au parent
// (App) via onLoginSuccess, qui bascule alors sur la page d'accueil.
// Le rôle n'est plus choisi ici : il est déduit du JWT renvoyé par le backend.
export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  // Met à jour le champ dont l'attribut `name` correspond à la clé du state.
  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResendMsg('');
    setLoading(true);

    try {
      const res = await login(form);

      if (res.ok) {
        const accessToken = res.data?.accessToken;
        if (!accessToken) {
          setError('Réponse invalide du serveur.');
          setLoading(false);
          return;
        }
        onLoginSuccess(accessToken);
        return;
      } else if (res.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else if (res.status === 403) {
        setError(res.data?.error || 'Compte en attente de validation.');
        if (res.data?.code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
      } else if (res.status === 400) {
        setError('Données invalides.');
      } else {
        setError('Une erreur est survenue.');
      }
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    const res = await resendVerification(form.email);
    setResendMsg(res.ok ? 'Email renvoyé ✅ Vérifie ta boîte mail.' : 'Impossible de renvoyer pour le moment.');
  };

  const handleForgot = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotMsg('');
    setLoading(true);
    try {
      // Réponse générique côté back (anti-énumération) → message neutre ici aussi.
      await forgotPassword(form.email);
      setForgotMsg("Si un compte correspond à cet email, un lien de réinitialisation vient d'être envoyé.");
    } catch {
      setForgotMsg('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Mode « mot de passe oublié » : on ne demande que l'email.
  if (forgotMode) {
    return (
      <form className="auth-form" onSubmit={handleForgot}>
        <p className="auth-help">
          Saisis ton email : on t'envoie un lien pour choisir un nouveau mot de passe.
        </p>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleFieldChange}
        />

        {forgotMsg && <p className="auth-success">{forgotMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
        <button
          type="button"
          className="auth-link"
          onClick={() => { setForgotMode(false); setForgotMsg(''); }}
        >
          ← Retour à la connexion
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleFieldChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        value={form.password}
        onChange={handleFieldChange}
      />

      {error && <p className="auth-error">{error}</p>}

      {needsVerification && (
        <div className="auth-resend">
          <button type="button" onClick={handleResend}>
            Renvoyer l'email de vérification
          </button>
          {resendMsg && <p className="auth-success">{resendMsg}</p>}
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
      <button
        type="button"
        className="auth-link"
        onClick={() => { setForgotMode(true); setError(''); }}
      >
        Mot de passe oublié ?
      </button>
    </form>
  );
}
