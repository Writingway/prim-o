import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminPage from './pages/AdminPage';
import type { AuthSession, Role, Mode } from './types/types';
import { refresh, roleFromToken, logout as apiLogout } from './services/api';


function App() {
  // Session connectée gardée en mémoire, ou null si déconnecté.
  const [session, setSession] = useState<AuthSession | null>(null);
  const [booting, setBooting] = useState(true); // true tant que le refresh n'a pas répondu
  // Visiteur non connecté : page d'accueil (hub) ou page d'auth.
  const [publicView, setPublicView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<Mode>('login');
  // Connecté : accueil (hub) ou son dashboard.
  const [loggedView, setLoggedView] = useState<'landing' | 'dashboard'>('landing');

  // Au chargement : on échange le cookie refresh (httpOnly) contre un
  // nouvel accessToken. Sans ça, un F5 vide le state React → déconnexion.
  useEffect(() => {
    let alive = true;
    refresh()
      .then((res) => {
        if (alive && res.ok && res.data?.accessToken) {
          const token = res.data.accessToken;
          setSession({ accessToken: token, role: roleFromToken(token) });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setBooting(false);
      });
    return () => {
      alive = false;
    };
  }, []);


  const handleLoginSuccess = (accessToken: string, role: Role) => {
    setSession({ accessToken, role });
    setLoggedView('landing'); // après login → accueil, pas directement le dashboard
  };

  const handleLogout = () => {
    apiLogout().catch(() => {}); // on tente de révoquer côté serveur, mais on continue même en cas d'échec réseau
    setSession(null);
    setPublicView('landing');
    setLoggedView('landing');
  };

  // Booting : on attend la réponse du refresh pour savoir si on est connecté ou pas. 
  if (booting) {
    return <div className="app-loading">Chargement…</div>;
  }
  // Non connecté
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
  if (session.role === 'admin') {
    return <AdminPage accessToken={session.accessToken} onLogout={handleLogout} />;
  }

  // Connecté mais sur l'accueil (loggedView === 'landing') : on rend le hub.
  // Sans ce fallback, manager/employé tombaient sur un écran blanc.
  return (
    <LandingPage
      isLoggedIn={true}
      onLogin={() => {}}
      onRegister={() => {}}
      onDashboard={() => setLoggedView('dashboard')}
      onLogout={handleLogout}
    />
  );
}

export default App;
