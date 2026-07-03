// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Fixture component: throws during render to trigger the boundary.
function Boom(): never {
  throw new Error('boom');
}

afterEach(cleanup);

describe('ErrorBoundary', () => {
  it('affiche le fallback quand un enfant jette', () => {
    // React logs the caught error; silence it to keep the test output clean.
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
