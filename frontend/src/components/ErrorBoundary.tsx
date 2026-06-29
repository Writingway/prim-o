import { Component, type ErrorInfo, type ReactNode } from 'react';

// Filet de sécurité racine : une exception au rendu (n'importe où dans
// l'arbre) ne doit jamais laisser un écran blanc. On affiche un fallback
// avec un bouton de récupération au lieu de planter toute l'app.
//
// Doit être une CLASSE : React n'expose pas componentDidCatch / getDerivedStateFromError
// via un hook. C'est le seul cas où une classe reste obligatoire.

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  // Appelé quand un enfant jette au rendu → on bascule en mode fallback.
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // Point de branchement pour un logger (Sentry...) plus tard.
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erreur de rendu non gérée :', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
          <p className="text-sm text-gray-500">
            L'application a rencontré un problème inattendu.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
