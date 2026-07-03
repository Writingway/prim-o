import { Component, type ErrorInfo, type ReactNode } from 'react';

// Root safety net: a render exception anywhere in the tree must never leave a blank
// screen - show a fallback with a reload button instead of crashing the whole app.
//
// Must be a class component: React exposes getDerivedStateFromError / componentDidCatch
// only on classes, with no hook equivalent.

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // Hook point for an error reporter (e.g. Sentry) later.
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
