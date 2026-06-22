import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { createCompany, joinCompany } from '../services/api';
import { WRAPPER, CARD, TABS, tab, FORM, INPUT, SUBMIT, ERROR } from '../components/auth/authClasses';
import AuthBrand from '../components/auth/AuthBrand';

type ValidationErrorBody = { details?: Array<{ message: string }> };

type OnboardingPageProps = {
  // create & join renvoient tous deux un token frais → traitement commun.
  onDone: (accessToken: string) => void;
};

function firstValidationMessage(data: ValidationErrorBody | null): string | null {
  if (data && Array.isArray(data.details) && data.details[0]) return data.details[0].message;
  return null;
}

export default function OnboardingPage({ onDone }: OnboardingPageProps) {
  const [tabKey, setTab] = useState<'create' | 'join'>('create');
  const [companyName, setCompanyName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = tabKey === 'create'
        ? await createCompany({ companyName })
        : await joinCompany({ code });
      if (res.ok && res.data?.accessToken) { onDone(res.data.accessToken); return; }
      if (res.status === 409) setError('Vous appartenez déjà à une entreprise.');
      else if (res.status === 404 || res.status === 410) setError("Code d'invitation invalide ou expiré.");
      else if (res.status === 400) setError(firstValidationMessage(res.data) || 'Données invalides.');
      else setError('Une erreur est survenue.');
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={WRAPPER}>
      <div className={CARD}>
        <AuthBrand subtitle="Dernière étape : rejoins ou crée ton entreprise." />

        <div className={TABS}>
          <button type="button" className={tab(tabKey === 'create')} onClick={() => { setTab('create'); setError(''); }}>Créer une entreprise</button>
          <button type="button" className={tab(tabKey === 'join')} onClick={() => { setTab('join'); setError(''); }}>Rejoindre</button>
        </div>

        <form className={FORM} onSubmit={submit}>
          {tabKey === 'create' ? (
            <input className={INPUT} name="companyName" placeholder="Nom de l'entreprise" value={companyName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)} />
          ) : (
            <input className={INPUT} name="code" placeholder="Code d'invitation" value={code}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} />
          )}
          {error && <p className={ERROR}>{error}</p>}
          <button className={SUBMIT} type="submit" disabled={loading}>
            {loading ? 'Chargement…' : tabKey === 'create' ? "Créer l'entreprise" : 'Rejoindre'}
          </button>
        </form>
      </div>
    </div>
  );
}
