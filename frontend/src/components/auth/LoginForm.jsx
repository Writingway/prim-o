import { useState } from 'react';
import { login } from '../../services/api';

// Formulaire de connexion. À la réussite, remonte le token + rôle au parent
// (App) via onLoginSuccess, qui bascule alors sur la page d'accueil.
export default function LoginForm({ role, onLoginSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(role, form);

      if (res.ok) {
        onLoginSuccess(res.data.accessToken, role);
        return;
      } else if (res.status === 401) {
        setError('Email ou mot de passe incorrect.');
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
        onChange={update}
      />
      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        value={form.password}
        onChange={update}
      />

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
    </form>
  );
}
