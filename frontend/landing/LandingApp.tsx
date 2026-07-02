import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LegalPage, { type LegalPageKey } from '../src/pages/LegalPage';
import LandingPage from '../src/pages/LandingPage';

// URL de l'app réelle quand elle sera en ligne. Tant que null, les CTA
// (« Créer mon compte », « S'identifier ») affichent un toast d'attente.
const APP_URL: string | null = null;

function legalFromHash(): LegalPageKey | null {
  const h = window.location.hash.replace('#', '');
  return h === 'privacy' || h === 'mentions' || h === 'cgu' ? h : null;
}

// Vitrine autonome : la landing + pages légales, sans router ni backend.
// Le teaser d'offres de la landing est déjà best-effort : sans API il se
// masque tout seul, et le catalogue affiche son état vide propre.
export default function LandingApp() {
  const [legalPage, setLegalPage] = useState<LegalPageKey | null>(legalFromHash);
  useEffect(() => {
    const onHash = () => setLegalPage(legalFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (legalPage) {
    return <LegalPage page={legalPage} onBack={() => { window.location.hash = ''; }} />;
  }

  const toApp = () => {
    if (APP_URL) { window.location.href = APP_URL; return; }
    toast.info("L'application ouvre très bientôt !");
  };

  return (
    <LandingPage isLoggedIn={false} onLogin={toApp} onRegister={toApp} onDashboard={toApp} />
  );
}
