// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Composant cobaye : jette au rendu pour déclencher la boundary.
function Boom(): never {
  throw new Error('boom');
}

afterEach(cleanup);

describe('ErrorBoundary', () => {
  it('affiche le fallback quand un enfant jette', () => {
    // React loggue l'erreur capturée → on coupe le bruit dans la sortie test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeDefined();

    spy.mockRestore();
  });

  it('rend les enfants normalement sans erreur', () => {
    render(
      <ErrorBoundary>
        <p>contenu sain</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('contenu sain')).toBeDefined();
    expect(screen.queryByText('Une erreur est survenue')).toBeNull();
  });
});
