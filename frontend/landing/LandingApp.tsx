import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LegalPage, { type LegalPageKey } from '../src/pages/LegalPage';
import LandingPage from '../src/pages/LandingPage';

// URL of the real app once it goes live. While null, the CTAs
// (« Créer mon compte », « S'identifier ») show a "coming soon" toast.
const APP_URL: string | null = null;

function legalFromHash(): LegalPageKey | null {
  const h = window.location.hash.replace('#', '');
  return h === 'privacy' || h === 'mentions' || h === 'cgu' ? h : null;
}

// Standalone showcase: the landing plus the legal pages, with no router or backend.
// The landing's offer teaser is already best-effort — with no API it hides itself,
// and the catalog falls back to its own empty state.
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
