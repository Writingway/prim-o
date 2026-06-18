import { useState } from 'react';
import RoleSelector from '../components/auth/RoleSelector';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import type { Role, Mode } from '../types/types';
import './AuthPage.css';

type AuthPageProps = {
  onLoginSuccess: (accessToken: string, role: Role) => void;
  initialMode?: Mode;
  onBack?: () => void;
};

// Page d'authentification unique (option A) :
// - un rôle : manager / employee
// - un mode : login / register
// Le formulaire affiché dépend de ces deux réglages.
export default function AuthPage({ onLoginSuccess, initialMode = 'login', onBack }: AuthPageProps) {
  const [role, setRole] = useState<Role>('owner');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [successMessage, setSuccessMessage] = useState('');

  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    setSuccessMessage('');
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSuccessMessage('');
  };

  const handleRegisterSuccess = () => {
    setSuccessMessage('Compte créé ✅ Vous pouvez maintenant vous connecter.');
    setMode('login');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack}>
            ← Retour
          </button>
        )}
        <h1 className="auth-logo">Prim'O</h1>

        <AuthTabs mode={mode} onChange={changeMode}/>
        {mode === 'register' && <RoleSelector role={role} onChange={changeRole} />}

        {successMessage && <p className="auth-success">{successMessage}</p>}

        {mode === 'login' ? (
          <LoginForm onLoginSuccess={onLoginSuccess} />
        ) : (
          <RegisterForm role={role} onSuccess={handleRegisterSuccess} />
        )}
      </div>
    </div>
  );
}
