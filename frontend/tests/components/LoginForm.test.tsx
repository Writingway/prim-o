// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '@/components/auth/LoginForm';

// On mocke la couche API (barrel services/api) : le formulaire est testé isolé
// du réseau. Chaque test pilote la réponse de login/resendVerification/forgotPassword.
const login = vi.fn();
const resendVerification = vi.fn();
const forgotPassword = vi.fn();
vi.mock('@/services/api', () => ({
  login: (...a: unknown[]) => login(...a),
  resendVerification: (...a: unknown[]) => resendVerification(...a),
  forgotPassword: (...a: unknown[]) => forgotPassword(...a),
}));

function res(status: number, data?: unknown) {
  return { ok: status < 400, status, data };
}

// Remplit email + mot de passe puis soumet.
function fillAndSubmit(email = 'a@b.c', password = 'Password1') {
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: email } });
  fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { name: 'password', value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
}

beforeEach(() => {
  login.mockReset();
  resendVerification.mockReset();
  forgotPassword.mockReset();
});
afterEach(cleanup);

describe('LoginForm', () => {
  it('login ok → remonte le token au parent via onLoginSuccess', async () => {
    login.mockResolvedValue(res(200, { accessToken: 'jwt-frais' }));
    const onLoginSuccess = vi.fn();
    render(<LoginForm onLoginSuccess={onLoginSuccess} />);

    fillAndSubmit();

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith('jwt-frais'));
  });

  it('200 sans accessToken → « Réponse invalide du serveur. », pas de callback', async () => {
    login.mockResolvedValue(res(200, {}));
    const onLoginSuccess = vi.fn();
    render(<LoginForm onLoginSuccess={onLoginSuccess} />);

    fillAndSubmit();

    expect(await screen.findByText('Réponse invalide du serveur.')).toBeDefined();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('401 → « Email ou mot de passe incorrect. »', async () => {
    login.mockResolvedValue(res(401));
    render(<LoginForm onLoginSuccess={vi.fn()} />);

    fillAndSubmit();

    expect(await screen.findByText('Email ou mot de passe incorrect.')).toBeDefined();
  });

  it('403 EMAIL_NOT_VERIFIED → affiche le lien de renvoi de vérification', async () => {
    login.mockResolvedValue(res(403, { code: 'EMAIL_NOT_VERIFIED', error: 'Email non vérifié.' }));
    render(<LoginForm onLoginSuccess={vi.fn()} />);

    fillAndSubmit();

    expect(await screen.findByText('Email non vérifié.')).toBeDefined();
    const resendBtn = await screen.findByRole('button', { name: "Renvoyer l'email de vérification" });

    resendVerification.mockResolvedValue(res(200));
    fireEvent.click(resendBtn);
    expect(await screen.findByText('Email renvoyé. Vérifie ta boîte mail.')).toBeDefined();
    expect(resendVerification).toHaveBeenCalledWith('a@b.c');
  });

  it('réseau coupé → message « backend lancé ? »', async () => {
    login.mockRejectedValue(new Error('network'));
    render(<LoginForm onLoginSuccess={vi.fn()} />);

    fillAndSubmit();

    expect(await screen.findByText('Impossible de joindre le serveur. Le backend est-il lancé ?')).toBeDefined();
  });

  it('mot de passe oublié → message neutre anti-énumération', async () => {
    forgotPassword.mockResolvedValue(res(200));
    render(<LoginForm onLoginSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mot de passe oublié ?' }));
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'a@b.c' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(
      await screen.findByText("Si un compte correspond à cet email, un lien de réinitialisation vient d'être envoyé."),
    ).toBeDefined();
    expect(forgotPassword).toHaveBeenCalledWith('a@b.c');
  });
});
