import type { Role } from '../types/types';
import Layout from '../components/layout/Layout';
import BottomNav from '../components/layout/BottomNav';
import OfferCatalog from '../components/offers/OfferCatalog';
import Icon from '../components/ui/Icon';
import logo2 from '../assets/logos/logo_2.png';

type LandingPageProps = {
  isLoggedIn: boolean;
  role?: Role;
  onLogin: () => void;
  onRegister: () => void;
  onDashboard: () => void;
  onLogout: () => void;
};

// Page d'accueil / hub public : catalogue d'offres partenaires. Header blanc
// minimal : logo Prim'O centré + « S'identifier » à droite (→ route /auth).
// Le même catalogue est rendu dans l'espace employé via <OfferCatalog>.
export default function LandingPage({
  isLoggedIn,
  role,
  onLogin,
  onDashboard,
}: LandingPageProps) {
  const canRedeem = isLoggedIn && (role === 'employee' || role === 'manager');

  const header = (
    <header className="sticky top-0 z-20 flex items-center justify-center border-b border-primo-line bg-white px-5 py-3.5 sm:px-8">
      {/* Logo centré */}
      <img src={logo2} alt="Prim'O" className="h-9 w-auto" />

      {/* Collé à droite : icône profil + « S'identifier » → /auth */}
      <button
        type="button"
        onClick={isLoggedIn ? onDashboard : onLogin}
        aria-label={isLoggedIn ? 'Mon espace' : "S'identifier"}
        className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full border border-primo-line bg-white px-3.5 py-2 text-sm font-bold text-primo-ink transition hover:bg-primo-surface sm:right-8"
      >
        <Icon name="user" size={17} />
        <span className="hidden sm:inline">{isLoggedIn ? 'Mon espace' : "S'identifier"}</span>
      </button>
    </header>
  );

  return (
    <Layout
      header={header}
      bottomNav={
        isLoggedIn ? (
          <BottomNav
            items={[
              { key: 'offres', label: 'Offres', icon: 'gift', targetId: '' },
              { key: 'espace', label: 'Mon espace', icon: 'home', targetId: '' },
            ]}
            active="offres"
            onSelect={(it) => {
              if (it.key === 'espace') onDashboard();
            }}
          />
        ) : undefined
      }
    >
      <div className="min-h-screen bg-primo-surface">
        <OfferCatalog
          isLoggedIn={isLoggedIn}
          canRedeem={canRedeem}
          onSeeSpending={isLoggedIn ? onDashboard : undefined}
          largeDesktopCards
          className="mx-auto max-w-[1100px] px-5 pb-24 pt-8 lg:pb-16"
        />
      </div>
    </Layout>
  );
}
