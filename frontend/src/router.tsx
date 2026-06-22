import { useEffect } from 'react';
import {
  createRootRouteWithContext, createRoute, createRouter,
  RouterProvider, Outlet, useNavigate, redirect,
} from '@tanstack/react-router';
import { getIdentity, normalizeRole, clearIdentityCache, type Identity } from './services/api/identity';
import { setAccessToken, logout as apiLogout, registerSessionExpired } from './services/api';
import type { Mode } from './types/types';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminPage from './pages/AdminPage';
import OnboardingPage from './pages/OnboardingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


// Contexte router = identité (source de vérité). Les gardes Phase B liront ça.
type RouterContext = { identity: Identity | null };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  // (Re)charge l'identité au boot et après chaque router.invalidate() (login/logout).
  beforeLoad: async (): Promise<RouterContext> => ({ identity: await getIdentity() }),
  component: () => <Outlet />,
});

// Helper logout partagé.
async function doLogout(navigate: ReturnType<typeof useNavigate>) {
  await apiLogout().catch(() => {});  // révoque côté serveur, best-effort
  setAccessToken(null);
  clearIdentityCache();
  await router.invalidate();           // identity → null
  navigate({ to: '/' });
}

// ── / : accueil (hub) ──
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Le lien de reset (envoyé par mail) pointe sur /?reset-token=… → on l'intercepte ici.
  validateSearch: (s: Record<string, unknown>): { 'reset-token'?: string } => ({
    'reset-token': typeof s['reset-token'] === 'string' ? (s['reset-token'] as string) : undefined,
  }),
  component: function IndexRoute() {
    const navigate = useNavigate();
    const { identity } = indexRoute.useRouteContext();
    const { 'reset-token': resetToken } = indexRoute.useSearch();
    if (resetToken) {
      return (
        <ResetPasswordPage
          token={resetToken}
          onDone={() => navigate({ to: '/auth', search: { mode: 'login' } })}
        />
      );
    }
    return (
      <LandingPage
        isLoggedIn={!!identity}
        role={normalizeRole(identity?.role ?? null) ?? undefined}
        onLogin={() => navigate({ to: '/auth', search: { mode: 'login' } })}
        onRegister={() => navigate({ to: '/auth', search: { mode: 'register' } })}
        onDashboard={() => navigate({ to: '/dashboard' })}
        onLogout={() => doLogout(navigate)}
      />
    );
  },
});

// ── /auth : login / register ──
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; verified?: '1' | '0' } => {
    const m = s.mode;
    const v = s.verified;
    return {
      mode: m === 'register' || m === 'login' ? m : undefined,
      verified: v === '1' || v === '0' ? v : undefined,
    };
  },
  beforeLoad: ({ context }) => {
    if (context.identity) throw redirect({ to: '/' });   // déjà loggé → accueil
  },
  component: function AuthRoute() {
    const navigate = useNavigate();
    const { mode, verified } = authRoute.useSearch();
    // Retour du lien de vérification email (GET backend → redirect ?verified=).
    const notice =
      verified === '1' ? { type: 'success' as const, text: 'Email vérifié ✅ Tu peux te connecter.' }
      : verified === '0' ? { type: 'error' as const, text: 'Lien de vérification invalide ou expiré.' }
      : undefined;
    return (
      <AuthPage
        initialMode={mode ?? 'login'}
        onBack={() => navigate({ to: '/' })}
        notice={notice}
        onLoginSuccess={async (token) => {       // identité = /auth/me (plus de décodage JWT)
          setAccessToken(token);
          clearIdentityCache();
          await router.invalidate();
          navigate({ to: '/' });                 // après login → accueil (comportement actuel)
        }}
      />
    );
  },
});

// ── /dashboard : route le bon dashboard selon le rôle ──
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ context }) => {
    const id = context.identity;
    if (!id) throw redirect({ to: '/auth' });
    // Flottant (pas d'entreprise) → onboarding. Admin exempté (companyId null normal).
    if (id.role !== 'ADMIN' && id.companyId === null) throw redirect({ to: '/onboarding' });
  },
  component: function DashboardRoute() {
    const navigate = useNavigate();
    const { identity } = dashboardRoute.useRouteContext();
    const role = normalizeRole(identity?.role ?? null);
    const onLogout = () => doLogout(navigate);
    const onBack = () => navigate({ to: '/' });
    if (role === 'manager' || role === 'owner')
      return <ManagerDashboard role={role} onLogout={onLogout} onBack={onBack} />;
    if (role === 'employee') return <EmployeeDashboard onLogout={onLogout} onBack={onBack} />;
    if (role === 'admin') return <AdminPage onLogout={onLogout} onBack={onBack} />;
    return <div className="app-loading">Chargement…</div>;   // Phase B : redirection /auth ou /onboarding
  },
});

// ── /admin (spec) - pour l'instant = AdminPage ──
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: ({ context }) => {
    const id = context.identity;
    if (!id) throw redirect({ to: '/auth' });
    if (id.role !== 'ADMIN') throw redirect({ to: '/dashboard' });
  },
  component: function AdminRoute() {
    const navigate = useNavigate();
    return <AdminPage onLogout={() => doLogout(navigate)} onBack={() => navigate({ to: '/' })} />;
  },
});

// ── /onboarding : écrans Phase C ──
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  beforeLoad: ({ context }) => {
    const id = context.identity;
    if (!id) throw redirect({ to: '/auth' });
    if (id.role === 'ADMIN') throw redirect({ to: '/admin' });
    if (id.companyId !== null) throw redirect({ to: '/dashboard' });  // déjà rattaché
  },
  component: function OnboardingRoute() {
    const navigate = useNavigate();
    return (
      <OnboardingPage
        onDone={async (token) => {           // create/join → token frais → dashboard
          setAccessToken(token);
          clearIdentityCache();
          await router.invalidate();
          navigate({ to: '/dashboard' });
        }}
      />
    );
  },
});

// ── /billing/return : remplace le hack ?payment= (Phase D) ──
const billingReturnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/billing/return',
  component: function BillingReturn() {
    const navigate = useNavigate();
    useEffect(() => { navigate({ to: '/dashboard' }); }, [navigate]);
    return <div className="app-loading">Retour paiement…</div>;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute, authRoute, dashboardRoute, adminRoute, onboardingRoute, billingReturnRoute,
]);

export const router = createRouter({
  routeTree,
  context: { identity: null },        // valeur initiale, écrasée par beforeLoad
  defaultPreload: 'intent',
});

// Session morte (refresh refusé) → recharge le contexte ; Phase B redirigera.
registerSessionExpired(() => { clearIdentityCache(); router.invalidate(); });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}

export { RouterProvider };
