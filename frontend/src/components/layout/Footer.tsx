import HeroLogo from '@/components/dashboard/HeroLogo';

// Footer légal : un lien par document (Confidentialité, Mentions légales, CGU).
// Chaque lien pointe vers son hash (#privacy/#mentions/#cgu) que App.tsx
// intercepte pour afficher le document correspondant (LegalPage).
const LEGAL: { key: string; title: string }[] = [
  { key: 'privacy', title: 'Politique de confidentialité' },
  { key: 'mentions', title: 'Mentions légales' },
  { key: 'cgu', title: 'Conditions générales (CGU)' },
];

export default function Footer() {
  return (
    <footer className="bg-primo-teal text-white">
      <div className="mx-auto max-w-[1000px] px-5 py-8 sm:px-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <HeroLogo className="!mx-0 h-9" />

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LEGAL.map((doc) => (
              <a
                key={doc.key}
                href={`#${doc.key}`}
                className="text-[13px] text-white/70 transition hover:text-white hover:underline"
              >
                {doc.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5 text-center text-[13px] text-white/50">
          © {new Date().getFullYear()} Prim'O — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
