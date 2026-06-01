// Sélecteur de rôle : Employeur / Employé.
export default function RoleSelector({ role, onChange }) {
  return (
    <div className="role-selector">
      <button
        type="button"
        className={role === 'employer' ? 'active' : ''}
        onClick={() => onChange('employer')}
      >
        Employeur
      </button>
      <button
        type="button"
        className={role === 'employee' ? 'active' : ''}
        onClick={() => onChange('employee')}
      >
        Employé
      </button>
    </div>
  );
}
