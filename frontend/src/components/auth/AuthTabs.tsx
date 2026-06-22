import type { Mode } from '../../types/types';
import { TABS, tab } from './authClasses';

type AuthTabsProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

// Onglets : Se connecter / S'inscrire.
export default function AuthTabs({ mode, onChange }: AuthTabsProps) {
  return (
    <div className={TABS}>
      <button
        type="button"
        className={tab(mode === 'login')}
        onClick={() => onChange('login')}>
        Se connecter
      </button>
      <button
        type="button"
        className={tab(mode === 'register')}
        onClick={() => onChange('register')}>
        S'inscrire
      </button>
    </div>
  );
}
