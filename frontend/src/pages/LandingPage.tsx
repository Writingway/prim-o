import type { Role } from '../types/types';
import Layout from '../components/layout/Layout';
import BottomNav from '../components/layout/BottomNav';
import OfferCatalog from '../components/offers/OfferCatalog';
import { HEADER_BTN_PRIMARY, HEADER_BTN_GHOST } from '../components/layout/headerButtons';

type LandingPageProps = {
  isLoggedIn: boolean;
  role?: Role;
  onLogin: () => void;
  onRegister: () => void;
  onDashboard: () => void;
  onLogout: () => void;
};

// Page d'accueil / hub public : catalogue d'offres partenaires. Le même catalogue
// est rendu dans l'espace employé (onglet Offres) via <OfferCatalog>, garantissant
// une expérience identique des deux côtés.
export default function LandingPage({
  isLoggedIn,
  role,
  onLogin,
  onRegister,
  onDashboard,
  onLogout,
}: LandingPageProps) {
  // Achat réservé aux employés ET managers (le manager dépense sa rétribution).
  const canRedeem = isLoggedIn && (role === 'employee' || role === 'manager');

  return (
    <Layout
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
      headerActions={
        isLoggedIn ? (
          <>
            <button className={HEADER_BTN_PRIMARY} type="button" onClick={onDashboard}>
              Mon tableau de bord
            </button>
            <button className={HEADER_BTN_GHOST} type="button" onClick={onLogout}>
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <button className={HEADER_BTN_GHOST} type="button" onClick={onLogin}>
              Se connecter
            </button>
            <button className={HEADER_BTN_PRIMARY} type="button" onClick={onRegister}>
              S'inscrire
            </button>
          </>
        )
      }
    >
      <div className="min-h-screen bg-primo-surface">
        <OfferCatalog
          isLoggedIn={isLoggedIn}
          canRedeem={canRedeem}
          onSeeSpending={isLoggedIn ? onDashboard : undefined}
          className="mx-auto max-w-[1000px] px-5 pb-24 pt-8 lg:pb-16"
        />
      </div>
    </Layout>
  );
}
