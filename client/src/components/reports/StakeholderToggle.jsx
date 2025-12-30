import { User, BarChart3, Users } from 'lucide-react';

/**
 * StakeholderToggle — Role-based view switcher
 * 
 * Allows switching between different perspectives:
 * - Manager: Gaps críticos, Bus factor, Acciones
 * - Director: Health Score, Mapa de competencias, ROI
 * - HR: Distribución talento, IDPs, Sucesión
 */

const ROLES = [
  { id: 'manager', label: 'Manager', icon: User },
  { id: 'director', label: 'Director', icon: BarChart3 },
  { id: 'hr', label: 'HR', icon: Users },
];

export default function StakeholderToggle({ activeRole, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 mr-2">Vista:</span>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isActive = activeRole === role.id;
          
          return (
            <button
              key={role.id}
              onClick={() => onChange(role.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
