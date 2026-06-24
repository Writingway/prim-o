import { useEffect } from 'react';
import {
  createRootRouteWithContext, createRoute, createRouter,
  RouterProvider, Outlet, useNavigate, redirect,
} from '@tanstack/react-router';
import { getIdentity, normalizeRole, clearIdentityCache, type Identity } from './services/api/identity';
import { setAccessToken, logout as apiLogout, registerSessionExpired } from './services/api';
import type { Mode } from './types/types';
import LandingPage from './pages/LandingPage';
import Splash from './pages/Splash';
import AuthPage from './pages/AuthPage';
import { useIsDesktop } from './hooks/useIsDesktop';
import ManagerDashboard from './pages/ManagerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import StatsPage from './pages/StatsPage';
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
  // `/` est la page visiteur. Un utilisateur connecté n'a rien à y faire : son
  // espace (avec le même catalogue d'offres) est sur /dashboard. On le redirige —
  // sauf s'il suit un lien de reset (cas où on laisse le flux se dérouler).
  beforeLoad: ({ context, search }) => {
    if (search['reset-token']) return;
    if (context.identity) throw redirect({ to: '/dashboard' });
  },
  component: function IndexRoute() {
    const navigate = useNavigate();
    const { identity } = indexRoute.useRouteContext();
    const { 'reset-token': resetToken } = indexRoute.useSearch();
    const isDesktop = useIsDesktop();
    if (resetToken) {
      return (
        <ResetPasswordPage
          token={resetToken}
          onDone={() => navigate({ to: '/auth', search: { mode: 'login' } })}
        />
      );
    }
    // Visiteur non connecté sur MOBILE → splash d'entrée. Sur desktop (ou une
    // fois connecté), accès direct à la landing.
    if (!identity && !isDesktop) {
      return (
        <Splash
          onRegister={() => navigate({ to: '/auth', search: { mode: 'register' } })}
          onLogin={() => navigate({ to: '/auth', search: { mode: 'login' } })}
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
      verified === '1' ? { type: 'success' as const, text: 'Email vérifié. Tu peux te connecter.' }
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
          navigate({ to: '/dashboard' });        // après login → son espace (le rôle est aiguillé par /dashboard)
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
    const firstName = identity?.firstName ?? null;
    const profilePhoto = identity?.profilePhoto ?? null;
    if (role === 'owner') return <OwnerDashboard onLogout={onLogout} onBack={onBack} onStats={() => navigate({ to: '/stats' })} firstName={firstName} profilePhoto={profilePhoto} />;
    if (role === 'manager') return <ManagerDashboard onLogout={onLogout} onBack={onBack} firstName={firstName} profilePhoto={profilePhoto} />;
    if (role === 'employee') return <EmployeeDashboard onLogout={onLogout} onBack={onBack} firstName={firstName} profilePhoto={profilePhoto} />;
    if (role === 'admin') return <AdminPage onLogout={onLogout} onBack={onBack} />;
    return <div className="app-loading">Chargement…</div>;   // Phase B : redirection /auth ou /onboarding
  },
});

// ── /stats : tableau de bord statistiques employeur (§3.2/§3.4) — OWNER only ──
const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stats',
  beforeLoad: ({ context }) => {
    const id = context.identity;
    if (!id) throw redirect({ to: '/auth' });
    if (id.role !== 'OWNER') throw redirect({ to: '/dashboard' });
  },
  component: function StatsRoute() {
    const navigate = useNavigate();
    return (
      <StatsPage
        onLogout={() => doLogout(navigate)}
        onBack={() => navigate({ to: '/dashboard' })}
        onNavTab={(tab) => navigate({ to: '/dashboard', hash: tab })}
      />
    );
  },
});

// ── /admin (spec) — pour l'instant = AdminPage ──
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
  indexRoute, authRoute, dashboardRoute, statsRoute, adminRoute, onboardingRoute, billingReturnRoute,
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
