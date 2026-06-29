import { useState, useEffect } from 'react';
import LegalPage, { type LegalPageKey } from './pages/LegalPage';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

function legalFromHash(): LegalPageKey | null {
  const h = window.location.hash.replace('#', '');
  return h === 'privacy' || h === 'mentions' || h === 'cgu' ? h : null;
}

function App() {
  const [legalPage, setLegalPage] = useState<LegalPageKey | null>(legalFromHash);
  useEffect(() => {
    const onHash = () => setLegalPage(legalFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (legalPage) {
    return <LegalPage page={legalPage} onBack={() => { window.location.hash = ''; }} />;
  }
  return <RouterProvider router={router} />;
}

export default App;
