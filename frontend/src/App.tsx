import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import type { AuthSession, Role } from './types/types';

function App() {
  // Session connectée gardée en mémoire, ou null si déconnecté.
  const [session, setSession] = useState<AuthSession | null>(null);

  const handleLoginSuccess = (accessToken: string, role: Role) =>
    setSession({ accessToken, role });
  const handleLogout = () => setSession(null);

  if (!session) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Chaque rôle a son dashboard ; l'admin garde la page d'accueil pour l'instant.
  if (session.role === 'manager') {
    return <ManagerDashboard accessToken={session.accessToken} onLogout={handleLogout} />;
  }

  if (session.role === 'employee') {
    return <EmployeeDashboard accessToken={session.accessToken} onLogout={handleLogout} />;
  }

  return <HomePage role={session.role} onLogout={handleLogout} />;
}

export default App;
