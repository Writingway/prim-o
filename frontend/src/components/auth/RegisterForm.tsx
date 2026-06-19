import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { register } from '../../services/api';

type ValidationErrorBody = { details?: Array<{ message: string }> };

type RegisterFormProps = {
  // Inscription SANS auto-login : vérification email requise. Le parent affiche
  // un message « vérifie ton email » et bascule sur l'onglet connexion.
  onSuccess: () => void;
};

function firstValidationMessage(data: ValidationErrorBody | null): string | null {
  if (data && Array.isArray(data.details) && data.details[0]) return data.details[0].message;
  return null;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) { setError('Vous devez accepter la politique de confidentialité et les CGU.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await register(form);
      if (res.ok) { onSuccess(); return; }
      if (res.status === 409) setError('Cet email est déjà utilisé.');
      else if (res.status === 400) setError(firstValidationMessage(res.data) || 'Données invalides.');
      else setError('Une erreur est survenue.');
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <input name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleFieldChange} />
      <input name="lastName" placeholder="Nom" value={form.lastName} onChange={handleFieldChange} />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleFieldChange} />
      <input name="password" type="password" placeholder="Mot de passe (8 caractères min.)" value={form.password} onChange={handleFieldChange} />

      <label className="auth-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          J'ai lu et j'accepte les{' '}
          <a href="#cgu" target="_blank" rel="noopener noreferrer">CGU</a> et la{' '}
          <a href="#privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité</a>.
        </span>
      </label>

      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading || !consent}>{loading ? 'Chargement…' : 'Créer mon compte'}</button>
    </form>
  );
}
