// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '@/components/auth/RegisterForm';

// API mockée : le formulaire est testé sans réseau.
const register = vi.fn();
vi.mock('@/services/api', () => ({ register: (...a: unknown[]) => register(...a) }));

function res(status: number, data?: unknown) {
  return { ok: status < 400, status, data };
}

// Remplit les 4 champs. La case de consentement est laissée au test.
function fillFields() {
  fireEvent.change(screen.getByPlaceholderText('Prénom'), { target: { name: 'firstName', value: 'Jean' } });
  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { name: 'lastName', value: 'Dupont' } });
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'jean@ex.fr' } });
  fireEvent.change(screen.getByPlaceholderText('Mot de passe (8 caractères min.)'), { target: { name: 'password', value: 'Password1' } });
}

function checkConsent() {
  fireEvent.click(screen.getByRole('checkbox'));
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
}

beforeEach(() => register.mockReset());
afterEach(cleanup);

describe('RegisterForm', () => {
  it('sans consentement → bloque, message CGU, register jamais appelé', () => {
    render(<RegisterForm onSuccess={vi.fn()} />);
    fillFields();
    // Le bouton est disabled tant que la case n'est pas cochée : on soumet le form
    // directement pour prouver que la garde consent bloque quand même.
    fireEvent.submit(screen.getByRole('button', { name: 'Créer mon compte' }).closest('form')!);

    expect(screen.getByText('Vous devez accepter la politique de confidentialité et les CGU.')).toBeDefined();
    expect(register).not.toHaveBeenCalled();
  });

  it('consentement + ok → appelle onSuccess', async () => {
    register.mockResolvedValue(res(201, {}));
    const onSuccess = vi.fn();
    render(<RegisterForm onSuccess={onSuccess} />);

    fillFields();
    checkConsent();
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it('409 → « Cet email est déjà utilisé. »', async () => {
    register.mockResolvedValue(res(409));
    render(<RegisterForm onSuccess={vi.fn()} />);

    fillFields();
    checkConsent();
    submit();

    expect(await screen.findByText('Cet email est déjà utilisé.')).toBeDefined();
  });

  it('400 → remonte le 1er message de validation du backend', async () => {
    register.mockResolvedValue(res(400, { details: [{ message: 'Mot de passe trop court' }] }));
    render(<RegisterForm onSuccess={vi.fn()} />);

    fillFields();
    checkConsent();
    submit();

    expect(await screen.findByText('Mot de passe trop court')).toBeDefined();
  });

  it('400 sans details → « Données invalides. »', async () => {
    register.mockResolvedValue(res(400, {}));
    render(<RegisterForm onSuccess={vi.fn()} />);

    fillFields();
    checkConsent();
    submit();

    expect(await screen.findByText('Données invalides.')).toBeDefined();
  });
});
