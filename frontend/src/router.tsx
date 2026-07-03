import { useEffect } from 'react';
import {
  createRootRouteWithContext, createRoute, createRouter,
  Outlet, useNavigate, redirect,
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


// Router context carries the identity - the single source of truth read by every route guard.
type RouterContext = { identity: Identity | null };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  // (Re)loads the identity at boot and after every router.invalidate() (login/logout).
  beforeLoad: async (): Promise<RouterContext> => ({ identity: await getIdentity() }),
  component: () => <Outlet />,
});

async function doLogout(navigate: ReturnType<typeof useNavigate>) {
  // Server-side revocation is best-effort; local logout proceeds regardless.
  await apiLogout().catch(() => {});
  setAccessToken(null);
  clearIdentityCache();
  // Re-runs beforeLoad so context.identity becomes null.
  await router.invalidate();
  navigate({ to: '/' });
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // The password-reset link emailed to users points at /?reset-token=…; it is intercepted here.
  validateSearch: (s: Record<string, unknown>): { 'reset-token'?: string } => ({
    'reset-token': typeof s['reset-token'] === 'string' ? (s['reset-token'] as string) : undefined,
  }),
  // `/` is the visitor page. A logged-in user belongs on /dashboard (which carries the same offer
  // catalogue), so redirect there - unless a reset link is being followed, in which case the
  // reset flow must be allowed to run.
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
    // Anonymous visitors on mobile get the entry splash; on desktop (or once logged in) they go
    // straight to the landing page.
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
        onLogin={() => navigate({ to: '/auth', search: { mode: 'login' } })}
        onRegister={() => navigate({ to: '/auth', search: { mode: 'register' } })}
        onDashboard={() => navigate({ to: '/dashboard' })}
      />
    );
  },
});

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
    // Already logged in: no auth form; `/` itself forwards to /dashboard.
    if (context.identity) throw redirect({ to: '/' });
  },
  component: function AuthRoute() {
    const navigate = useNavigate();
    const { mode, verified } = authRoute.useSearch();
    // Return from the email-verification link (backend GET redirects here with ?verified=).
    const notice =
      verified === '1' ? { type: 'success' as const, text: 'Email vérifié. Tu peux te connecter.' }
      : verified === '0' ? { type: 'error' as const, text: 'Lien de vérification invalide ou expiré.' }
      : undefined;
    return (
      <AuthPage
        initialMode={mode ?? 'login'}
        onBack={() => navigate({ to: '/' })}
        notice={notice}
        onLoginSuccess={async (token) => {       // identity comes from /auth/me (no JWT decoding)
          setAccessToken(token);
          clearIdentityCache();
          await router.invalidate();
          navigate({ to: '/dashboard' });        // /dashboard dispatches by role
        }}
      />
    );
  },
});

// /dashboard is the single entry point for every logged-in role; it dispatches to the
// role-specific dashboard component.
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ context }) => {
    const id = context.identity;
    if (!id) throw redirect({ to: '/auth' });
    // "Floating" user (no company yet) goes to onboarding. Admins are exempt: a null companyId is
    // normal for them.
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
    // Unreachable once identity has loaded (the guard redirects); shown only for an unknown role.
    return <div className="app-loading">Chargement…</div>;
  },
});

// /stats: employer statistics dashboard (§3.2/§3.4), OWNER only.
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

// /admin is the spec-mandated path; for now it renders the same AdminPage as /dashboard does for
// the admin role.
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

// /onboarding: company create/join for users not yet attached to a company.
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  beforeLoad: ({ context }) => {
    const id = context.identity;
    if (!id) throw redirect({ to: '/auth' });
    if (id.role === 'ADMIN') throw redirect({ to: '/admin' });
    // Already attached to a company - onboarding is done.
    if (id.companyId !== null) throw redirect({ to: '/dashboard' });
  },
  component: function OnboardingRoute() {
    const navigate = useNavigate();
    return (
      <OnboardingPage
        onDone={async (token) => {           // create/join returns a fresh token (new companyId)
          setAccessToken(token);
          clearIdentityCache();
          await router.invalidate();
          navigate({ to: '/dashboard' });
        }}
      />
    );
  },
});

// /billing/return: Stripe return URL; replaces the old ?payment= query hack.
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

// Router config module, not a component file - Fast Refresh N/A here.
export const router = createRouter({
  routeTree,
  // Initial placeholder; rootRoute.beforeLoad supplies the real identity.
  context: { identity: null },
  defaultPreload: 'intent',
});

// Dead session (refresh token rejected): drop the cached identity and re-run the route guards,
// which redirect to /auth.
registerSessionExpired(() => { clearIdentityCache(); router.invalidate(); });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
