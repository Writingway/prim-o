import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import type { AuthSession, Role } from './types/types';

function App() {
  // Session connectée gardée en mémoire, ou null si déconnecté.
  const [session, setSession] = useState<AuthSession | null>(null);

  const handleLoginSuccess = (accessToken: string, role: Role) =>
    setSession({ accessToken, role });
  const handleLogout = () => setSession(null);

  return session ? (
    <HomePage role={session.role} onLogout={handleLogout} />
  ) : (
    <AuthPage onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
