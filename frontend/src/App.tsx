import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import type { AuthSession, Role, Mode } from './types/types';

function App() {
  // Session connectée gardée en mémoire, ou null si déconnecté.
  const [session, setSession] = useState<AuthSession | null>(null);
  // Visiteur non connecté : page d'accueil (hub) ou page d'auth.
  const [publicView, setPublicView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<Mode>('login');
  // Connecté : accueil (hub) ou son dashboard.
  const [loggedView, setLoggedView] = useState<'landing' | 'dashboard'>('landing');

  const handleLoginSuccess = (accessToken: string, role: Role) => {
    setSession({ accessToken, role });
    setLoggedView('landing'); // après login → accueil, pas directement le dashboard
  };

  const handleLogout = () => {
    setSession(null);
    setPublicView('landing');
    setLoggedView('landing');
  };

  // ── Non connecté ───────────────────────────────────────────
  if (!session) {
    if (publicView === 'auth') {
      return (
        <AuthPage
          initialMode={authMode}
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setPublicView('landing')}
        />
      );
    }
    return (
      <LandingPage
        isLoggedIn={false}
        onLogin={() => {
          setAuthMode('login');
          setPublicView('auth');
        }}
        onRegister={() => {
          setAuthMode('register');
          setPublicView('auth');
        }}
        onDashboard={() => {}}
        onLogout={() => {}}
      />
    );
  }

  // ── Connecté : dashboard si demandé (manager/employé), sinon accueil ──
  if (loggedView === 'dashboard' && session.role === 'manager') {
    return (
      <ManagerDashboard
        accessToken={session.accessToken}
        onLogout={handleLogout}
        onBack={() => setLoggedView('landing')}
      />
    );
  }
  if (loggedView === 'dashboard' && session.role === 'employee') {
    return (
      <EmployeeDashboard
        accessToken={session.accessToken}
        onLogout={handleLogout}
        onBack={() => setLoggedView('landing')}
      />
    );
  }

  // Accueil (hub) en mode connecté.
  return (
    <LandingPage
      isLoggedIn
      onLogin={() => {}}
      onRegister={() => {}}
      onDashboard={() => setLoggedView('dashboard')}
      onLogout={handleLogout}
    />
  );
}

export default App;
