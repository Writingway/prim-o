import { useState } from 'react';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import type { Mode } from '../types/types';
import './AuthPage.css';

type AuthPageProps = {
  onLoginSuccess: (accessToken: string) => void;
  onRegisterSuccess: (accessToken: string) => void;
  initialMode?: Mode;
  onBack?: () => void;
};

export default function AuthPage({ onLoginSuccess, onRegisterSuccess, initialMode = 'login', onBack }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {onBack && <button type="button" className="auth-back" onClick={onBack}>← Retour</button>}
        <h1 className="auth-logo">Prim'O</h1>

        <AuthTabs mode={mode} onChange={setMode} />

        {mode === 'login'
          ? <LoginForm onLoginSuccess={onLoginSuccess} />
          : <RegisterForm onSuccess={onRegisterSuccess} />}
      </div>
    </div>
  );
}
