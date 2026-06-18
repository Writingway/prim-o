import type { Role } from '../../types/types';

type RoleSelectorProps = {
  role: Role;
  onChange: (role: Role) => void;
};

// Sélecteur de rôle : Employeur (manager) / Employé.
export default function RoleSelector({ role, onChange }: RoleSelectorProps) {
  return (
    <div className="role-selector">
      <button
        type="button"
        className={role === 'owner' ? 'active' : ''}
        onClick={() => onChange('owner')}> Patron (créer entreprise)
      </button>
      <button
        type="button"
        className={role === 'employee' ? 'active' : ''}
        onClick={() => onChange('employee')}> Rejoindre avec un code
      </button>
    </div>
  );
}
