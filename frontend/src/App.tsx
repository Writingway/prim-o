import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminPage from './pages/AdminPage';
import LegalPage, { type LegalPageKey } from './pages/LegalPage';
import type { AuthSession, Role, Mode } from './types/types';
import { refresh, roleFromToken, logout as apiLogout, setAccessToken, registerSessionExpired } from './services/api';

// Lit la page légale depuis le hash de l'URL (#privacy, #mentions, #cgu).
function legalFromHash(): LegalPageKey | null {
  const h = window.location.hash.replace('#', '');
  return h === 'privacy' || h === 'mentions' || h === 'cgu' ? h : null;
}

// Retour de vérification email (redirigé par le backend).
function verifiedFromQuery(): { type: 'success' | 'error'; text: string } | null {
  const v = new URLSearchParams(window.location.search).get('verified');
  if (v === '1') return { type: 'success', text: 'Email vérifié ✅ Tu peux maintenant te connecter.' };
  if (v === '0') return { type: 'error', text: 'Lien de vérification invalide ou expiré.' };
  return null;
}

function App() {
  // Session connectée gardée en mémoire, ou null si déconnecté.
  const [session, setSession] = useState<AuthSession | null>(null);
  const [legalPage, setLegalPage] = useState<LegalPageKey | null>(legalFromHash);
  const [verifyNotice] = useState(verifiedFromQuery);

  useEffect(() => {
    const onHash = () => setLegalPage(legalFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!verifyNotice) return;
    // nettoie l'URL pour ne pas re-déclencher au F5
    const url = new URL(window.location.href);
    url.searchParams.delete('verified');
    url.searchParams.delete('reason');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    // l'utilisateur n'est pas connecté → on ouvre la page de connexion
    setAuthMode('login');
    setPublicView('auth');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


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
    // Session définitivement morte (refresh impossible) : api.ts nous
    // prévient ici → retour à l'état visiteur, proprement, une seule fois.
    registerSessionExpired(() => {
      setSession(null);
      setLoggedView('landing');
    });
    refresh()
      .then((res) => {
        if (alive && res.ok && res.data?.accessToken) {
          const token = res.data.accessToken;
          const role = roleFromToken(token);
          if (role){
            setSession({ accessToken: token, role });
            // Retour d'un paiement Stripe → ouvrir directement le dashboard.
            if (new URLSearchParams(window.location.search).get('payment')) {
              setLoggedView('dashboard');
            }
          }
          // role null → token illisible → on reste déconnecté, l'app ne plante pas
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
    setAccessToken(accessToken); // api.ts devient porteur du token
    setSession({ accessToken, role });
    setLoggedView('landing'); // après login → accueil, pas directement le dashboard
  };

  const handleLogout = () => {
    apiLogout().catch(() => {}); // on tente de révoquer côté serveur, mais on continue même en cas d'échec réseau
    setAccessToken(null);
    setSession(null);
    setPublicView('landing');
    setLoggedView('landing');
  };

    // Pages légales : affichées par-dessus tout (connecté ou non) via le hash.
  if (legalPage) {
    return <LegalPage page={legalPage} onBack={() => { window.location.hash = ''; }} />;
  }

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
          notice={verifyNotice ?? undefined}
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
  if (loggedView === 'dashboard' && (session.role === 'manager' || session.role === 'owner')) {
    return (
      <ManagerDashboard
        role={session.role}
        onLogout={handleLogout}
        onBack={() => setLoggedView('landing')}
      />
    );
  }
  if (loggedView === 'dashboard' && session.role === 'employee') {
    return (
      <EmployeeDashboard
        onLogout={handleLogout}
        onBack={() => setLoggedView('landing')}
      />
    );
  }
  if (loggedView === 'dashboard' && session.role === 'admin') {
    return (
      <AdminPage
        onLogout={handleLogout}
        onBack={() => setLoggedView('landing')}
      />
    );
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
