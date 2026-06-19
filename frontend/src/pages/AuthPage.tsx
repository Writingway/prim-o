import { useState } from 'react';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import type { Mode } from '../types/types';
import './AuthPage.css';

type AuthPageProps = {
  onLoginSuccess: (accessToken: string) => void;
  initialMode?: Mode;
  onBack?: () => void;
  // Bandeau passé par le router (ex. retour de vérification email).
  notice?: { type: 'success' | 'error'; text: string };
};

export default function AuthPage({ onLoginSuccess, initialMode = 'login', onBack, notice }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [successMessage, setSuccessMessage] = useState('');

  // Inscription sans auto-login : on confirme + bascule sur l'onglet connexion.
  const handleRegisterSuccess = () => {
    setSuccessMessage('Compte créé ✅ Vérifie ton email pour activer ton compte.');
    setMode('login');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {onBack && <button type="button" className="auth-back" onClick={onBack}> Retour</button>}
        <h1 className="auth-logo">Prim'O</h1>

        <AuthTabs mode={mode} onChange={setMode} />

        {notice && (
          <p className={notice.type === 'success' ? 'auth-success' : 'auth-error'}>{notice.text}</p>
        )}
        {successMessage && <p className="auth-success">{successMessage}</p>}

        {mode === 'login'
          ? <LoginForm onLoginSuccess={onLoginSuccess} />
          : <RegisterForm onSuccess={handleRegisterSuccess} />}
      </div>
    </div>
  );
}
