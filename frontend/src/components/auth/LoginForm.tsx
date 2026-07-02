import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { login, resendVerification, forgotPassword } from '../../services/api';
import { FORM, INPUT, SUBMIT, ERROR, SUCCESS, HELP, LINK } from './authClasses';

type LoginFormProps = {
  onLoginSuccess: (accessToken: string) => void;
};

// Login form. On success, passes the access token up to the parent (App) via
// onLoginSuccess, which then switches to the home page. The role is not chosen
// here: it is derived from the JWT returned by the backend.
export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

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
    setResendMsg(res.ok ? 'Email renvoyé. Vérifie ta boîte mail.' : 'Impossible de renvoyer pour le moment.');
  };

  const handleForgot = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotMsg('');
    setLoading(true);
    try {
      // The backend answers generically (anti account enumeration), so the message stays neutral too.
      await forgotPassword(form.email);
      setForgotMsg("Si un compte correspond à cet email, un lien de réinitialisation vient d'être envoyé.");
    } catch {
      setForgotMsg('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot-password mode: only the email is asked for.
  if (forgotMode) {
    return (
      <form className={FORM} onSubmit={handleForgot}>
        <p className={HELP}>
          Saisis ton email : on t'envoie un lien pour choisir un nouveau mot de passe.
        </p>
        <input
          className={INPUT}
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleFieldChange}
        />

        {forgotMsg && <p className={SUCCESS}>{forgotMsg}</p>}

        <button className={SUBMIT} type="submit" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
        <button
          type="button"
          className={LINK}
          onClick={() => { setForgotMode(false); setForgotMsg(''); }}
        >
           Retour à la connexion
        </button>
      </form>
    );
  }

  return (
    <form className={FORM} onSubmit={handleSubmit}>
      <input
        className={INPUT}
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleFieldChange}
      />
      <input
        className={INPUT}
        name="password"
        type="password"
        placeholder="Mot de passe"
        value={form.password}
        onChange={handleFieldChange}
      />

      {error && <p className={ERROR}>{error}</p>}

      {needsVerification && (
        <div className="flex flex-col gap-2">
          <button className={LINK} type="button" onClick={handleResend}>
            Renvoyer l'email de vérification
          </button>
          {resendMsg && <p className={SUCCESS}>{resendMsg}</p>}
        </div>
      )}

      <button className={SUBMIT} type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
      <button
        type="button"
        className={LINK}
        onClick={() => { setForgotMode(true); setError(''); }}
      >
        Mot de passe oublié ?
      </button>
    </form>
  );
}
