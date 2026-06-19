export default function Footer() {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} Prim'O - Tous droits réservés</span>
      <nav className="app-footer-links">
        <a href="#privacy">Politique de confidentialité</a>
        <a href="#mentions">Mentions légales</a>
        <a href="#cgu">CGU</a>
      </nav>
    </footer>
  );
}
