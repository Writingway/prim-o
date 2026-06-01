import { useState } from 'react';
import { login } from '../../services/api';

// Formulaire de connexion. L'UI est complète, mais la route backend
// /auth/{role}/login n'existe pas encore : un 404 affiche un message
// "bientôt disponible" (sera branché à l'étape suivante).
export default function LoginForm({ role }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await login(role, form);

      if (res.ok) {
        setInfo('Connexion réussie ✅');
      } else if (res.status === 404) {
        setInfo('La connexion sera bientôt disponible (route serveur à venir).');
      } else if (res.status === 401) {
        setError('Email ou mot de passe incorrect.');
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
      {info && <p className="auth-info">{info}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
    </form>
  );
}
