import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { registerManager, registerEmployee } from '../../services/api';
import type { Role } from '../../types/types';

// Corps d'erreur de validation renvoyé par le backend (ZodError -> details[]).
type ValidationErrorBody = {
  details?: Array<{ message: string }>;
};

type RegisterFormProps = {
  role: Role;
  onSuccess: () => void;
};

// Récupère le 1er message de validation renvoyé par le backend, ou null.
function firstValidationMessage(data: ValidationErrorBody | null): string | null {
  if (data && Array.isArray(data.details) && data.details[0]) {
    return data.details[0].message;
  }
  return null;
}

// Formulaire d'inscription. Les champs affichés dépendent du rôle :
// - manager  : companyName
// - employee : firstName, lastName, code (code entreprise)
export default function RegisterForm({ role, onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    code: '',
  });
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
      const res =
        role === 'manager'
          ? await registerManager({
              companyName: form.companyName,
              email: form.email,
              password: form.password,
            })
          : await registerEmployee({
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              password: form.password,
              code: form.code,
            });

      if (res.ok) {
        onSuccess();
        return;
      }

      if (res.status === 409) {
        setError('Cet email est déjà utilisé.');
      } else if (res.status === 410) {
        setError('Code entreprise invalide ou expiré.');
      } else if (res.status === 400) {
        setError(firstValidationMessage(res.data) || 'Données invalides.');
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
      {role === 'manager' && (
        <input
          name="companyName"
          placeholder="Nom de l'entreprise"
          value={form.companyName}
          onChange={handleFieldChange}
        />
      )}

      {role === 'employee' && (
        <>
          <input
            name="firstName"
            placeholder="Prénom"
            value={form.firstName}
            onChange={handleFieldChange}
          />
          <input
            name="lastName"
            placeholder="Nom"
            value={form.lastName}
            onChange={handleFieldChange}
          />
        </>
      )}

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
        placeholder="Mot de passe (8 caractères min.)"
        value={form.password}
        onChange={handleFieldChange}
      />

      {role === 'employee' && (
        <input
          name="code"
          placeholder="Code entreprise"
          value={form.code}
          onChange={handleFieldChange}
        />
      )}

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Créer mon compte'}
      </button>
    </form>
  );
}
