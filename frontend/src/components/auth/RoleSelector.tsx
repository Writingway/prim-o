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
        className={role === 'manager' ? 'active' : ''}
        onClick={() => onChange('manager')}> Employeur
      </button>
      <button
        type="button"
        className={role === 'employee' ? 'active' : ''}
        onClick={() => onChange('employee')}> Employé
      </button>
    </div>
  );
}
