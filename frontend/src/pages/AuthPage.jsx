import { useState } from 'react';
import RoleSelector from '../components/auth/RoleSelector';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import './AuthPage.css';

// Page d'authentification unique (option A) :
// - un rôle : employer / employee
// - un mode : login / register
// Le formulaire affiché dépend de ces deux réglages.
export default function AuthPage({ onLoginSuccess }) {
  const [role, setRole] = useState('employer');
  const [mode, setMode] = useState('login');
  const [success, setSuccess] = useState('');

  const changeRole = (r) => {
    setRole(r);
    setSuccess('');
  };

  const changeMode = (m) => {
    setMode(m);
    setSuccess('');
  };

  const handleRegisterSuccess = () => {
    setSuccess('Compte créé ✅ Vous pouvez maintenant vous connecter.');
    setMode('login');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-logo">Prim'O</h1>

        <RoleSelector role={role} onChange={changeRole} />
        <AuthTabs mode={mode} onChange={changeMode} />

        {success && <p className="auth-success">{success}</p>}

        {mode === 'login' ? (
          <LoginForm role={role} onLoginSuccess={onLoginSuccess} />
        ) : (
          <RegisterForm role={role} onSuccess={handleRegisterSuccess} />
        )}
      </div>
    </div>
  );
}
