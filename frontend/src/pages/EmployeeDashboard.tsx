import { logout as apiLogout } from '../services/api';
import './EmployeeDashboard.css';

type EmployeeDashboardProps = {
  accessToken: string;
  onLogout: () => void;
};

// Dashboard employé : espace personnel après connexion.
// Le backend confirme déjà le rôle (JWT) ; ici on présente l'espace côté front.
// Le solde et l'historique restent des placeholders tant que les endpoints
// employé (ex. GET /auth/me ne renvoie que id/role/companyId) ne fournissent
// pas ces données.
export default function EmployeeDashboard({ onLogout }: EmployeeDashboardProps) {
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // On déconnecte côté front même si l'appel réseau échoue.
    }
    onLogout();
  };

  return (
    <div className="emp-dash-wrapper">
      <div className="emp-dash-container">
        <header className="emp-dash-header">
          <h1 className="emp-dash-title">Prim'O — Mon espace</h1>
          <button className="emp-dash-logout" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </header>

        <section className="emp-dash-welcome">
          <p className="emp-dash-hello">Bienvenue ! 🎉</p>
          <p className="emp-dash-role">
            Vous êtes connecté en tant que <strong>Employé</strong>.
          </p>
        </section>

        <div className="emp-dash-cards">
          <div className="emp-dash-card">
            <div className="emp-dash-card-icon">🪙</div>
            <div className="emp-dash-card-label">Mon solde</div>
            <div className="emp-dash-card-value">— <span className="emp-dash-soon">à venir</span></div>
          </div>
          <div className="emp-dash-card">
            <div className="emp-dash-card-icon">📜</div>
            <div className="emp-dash-card-label">Historique</div>
            <div className="emp-dash-card-value emp-dash-muted">Bientôt disponible</div>
          </div>
        </div>

        <p className="emp-dash-note">
          Ton espace s'enrichira au fil des prochaines fonctionnalités (solde de
          tokens, historique, récompenses).
        </p>
      </div>
    </div>
  );
}
