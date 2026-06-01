// Onglets : Se connecter / S'inscrire.
export default function AuthTabs({ mode, onChange }) {
  return (
    <div className="auth-tabs">
      <button
        type="button"
        className={mode === 'login' ? 'active' : ''}
        onClick={() => onChange('login')}
      >
        Se connecter
      </button>
      <button
        type="button"
        className={mode === 'register' ? 'active' : ''}
        onClick={() => onChange('register')}
      >
        S'inscrire
      </button>
    </div>
  );
}
