import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { login, roleFromToken } from '../../services/api';
import type { Role } from '../../types/types';

type LoginFormProps = {
  onLoginSuccess: (accessToken: string, role: Role) => void;
};

// Formulaire de connexion. À la réussite, remonte le token + rôle au parent
// (App) via onLoginSuccess, qui bascule alors sur la page d'accueil.
// Le rôle n'est plus choisi ici : il est déduit du JWT renvoyé par le backend.
export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Met à jour le champ dont l'attribut `name` correspond à la clé du state.
  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(form);

      if (res.ok) {
        const accessToken = res.data?.accessToken;
        const role = accessToken ? roleFromToken(accessToken) : null;
        if (!accessToken || !role) {
          setError('Token illisible, impossible de déterminer le rôle.');
          setLoading(false);
          return;
        }
        onLoginSuccess(accessToken, role);
        return;
      } else if (res.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else if (res.status === 403) {
        setError(res.data?.error || 'Compte en attente de validation.');
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

      <button type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
    </form>
  );
}
