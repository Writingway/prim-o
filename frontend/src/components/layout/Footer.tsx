export default function Footer() {
  return (
    <footer className="p-4 text-center text-sm opacity-70">
      <span>© {new Date().getFullYear()} Prim'O - Tous droits réservés</span>
      <nav className="mt-1.5 flex flex-wrap justify-center gap-3.5">
        <a className="text-inherit no-underline hover:underline" href="#privacy">Politique de confidentialité</a>
        <a className="text-inherit no-underline hover:underline" href="#mentions">Mentions légales</a>
        <a className="text-inherit no-underline hover:underline" href="#cgu">CGU</a>
      </nav>
    </footer>
  );
}
