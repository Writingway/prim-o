import { useState } from 'react';
import { registerEmployer, registerEmployee } from '../../services/api';

// Récupère le 1er message de validation renvoyé par le backend (ZodError -> details[]).
function firstValidationMessage(data) {
  if (data && Array.isArray(data.details) && data.details[0]) {
    return data.details[0].message;
  }
  return null;
}

// Formulaire d'inscription. Les champs affichés dépendent du rôle :
// - employer : companyName
// - employee : firstName, lastName, employerId
export default function RegisterForm({ role, onSuccess }) {
  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employerId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res =
        role === 'employer'
          ? await registerEmployer({
              companyName: form.companyName,
              email: form.email,
              password: form.password,
            })
          : await registerEmployee({
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              password: form.password,
              employerId: form.employerId,
            });

      if (res.ok) {
        onSuccess();
        return;
      }

      if (res.status === 409) {
        setError('Cet email est déjà utilisé.');
      } else if (res.status === 404) {
        setError('Code entreprise invalide.');
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
      {role === 'employer' && (
        <input
          name="companyName"
          placeholder="Nom de l'entreprise"
          value={form.companyName}
          onChange={update}
        />
      )}

      {role === 'employee' && (
        <>
          <input
            name="firstName"
            placeholder="Prénom"
            value={form.firstName}
            onChange={update}
          />
          <input
            name="lastName"
            placeholder="Nom"
            value={form.lastName}
            onChange={update}
          />
        </>
      )}

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
        placeholder="Mot de passe (8 caractères min.)"
        value={form.password}
        onChange={update}
      />

      {role === 'employee' && (
        <input
          name="employerId"
          placeholder="Code entreprise"
          value={form.employerId}
          onChange={update}
        />
      )}

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Chargement…' : 'Créer mon compte'}
      </button>
    </form>
  );
}
