import { Link, useLocation } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

/**
 * SidebarUser - Interactive user footer for sidebar
 * 
 * Handles collapsed and expanded states:
 * - Expanded: Avatar + Name + ChevronRight
 * - Collapsed: Only Avatar centered
 * 
 * Links to /profile page for editing settings
 */

export default function SidebarUser({ isCollapsed }) {
  const { adminName, companyName } = useConfig();
  const location = useLocation();
  const isActive = location.pathname === '/profile';

  // Get initials for avatar
  const initials = adminName
    ? adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="p-2 border-t border-gray-100">
      <Link
        to="/profile"
        className={`
          flex items-center px-3 py-2.5 rounded-lg w-full
          transition-all duration-150 group overflow-hidden
          ${isActive
            ? 'bg-primary/10 text-primary'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
        title={isCollapsed ? `${adminName} - ${companyName}` : undefined}
      >
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center
          text-sm font-medium transition-colors
          ${isActive
            ? 'bg-primary text-white'
            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
          }
        `}>
          {initials}
        </div>

        {/* Name & Role - Fade transition */}
        <div
          className={`
            flex items-center overflow-hidden transition-all duration-300 ease-in-out
            ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3 flex-1 min-w-0'}
          `}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={adminName}>
              {adminName}
            </p>
            <p className="text-xs text-gray-400 truncate">Administrador</p>
          </div>

          {/* Chevron indicator */}
          <ChevronRight
            size={16}
            className={`flex-shrink-0 ml-2 transition-colors ${
              isActive ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'
            }`}
          />
        </div>
      </Link>
    </div>
  );
}
