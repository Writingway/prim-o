import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

function App() {
  // État connecté gardé en mémoire : { accessToken, role } ou null.
  const [auth, setAuth] = useState(null);

  const handleLoginSuccess = (accessToken, role) => setAuth({ accessToken, role });
  const handleLogout = () => setAuth(null);

  return auth ? (
    <HomePage role={auth.role} onLogout={handleLogout} />
  ) : (
    <AuthPage onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
