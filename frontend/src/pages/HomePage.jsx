import { logout as apiLogout } from '../services/api';
import './HomePage.css';

// Page d'accueil minimale affichée après connexion.
export default function HomePage({ role, onLogout }) {
  const roleLabel = role === 'employer' ? 'Employeur' : 'Employé';

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // On déconnecte côté front même si l'appel réseau échoue.
    }
    onLogout();
  };

  return (
    <div className="home-wrapper">
      <div className="home-card">
        <h1 className="home-logo">Prim'O</h1>
        <p className="home-welcome">Bienvenue ! 🎉</p>
        <p className="home-role">
          Vous êtes connecté en tant que <strong>{roleLabel}</strong>.
        </p>
        <button className="home-logout" type="button" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
