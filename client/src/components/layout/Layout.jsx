import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Grid3X3, 
  TrendingUp,
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import LoginModal from '../auth/LoginModal';

/**
 * Layout Component - App Shell
 * 
 * Estructura principal de la aplicación:
 * - Sidebar lateral colapsable con navegación
 * - Settings solo visible si está autenticado
 * - Botón de login/logout en la parte inferior
 */

// Navigation items - Settings only shows when authenticated
const getNavItems = (isAuthenticated) => {
  const items = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/team-matrix', icon: Grid3X3, label: 'Team Matrix' },
    { to: '/reports', icon: TrendingUp, label: 'Evolución' },
  ];
  
  // Only show Settings if authenticated
  if (isAuthenticated) {
    items.push({ to: '/settings', icon: Settings, label: 'Settings' });
  }
  
  return items;
};

export default function Layout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, login, logout } = useAuth();
  const { companyName, adminName } = useConfig();
  
  const navItems = getNavItems(isAuthenticated);

  const handleLoginSuccess = (token) => {
    login(token);
    setShowLoginModal(false);
    navigate('/settings');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-30 h-screen
          bg-surface shadow-lg
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header del Sidebar */}
        <div className="flex flex-col h-16 px-4 border-b border-gray-100 justify-center">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-light text-primary whitespace-nowrap">
                  Skills Matrix
                </h1>
                <p className="text-xs text-gray-400 truncate" title={companyName}>
                  {companyName}
                </p>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                aria-label="Colapsar sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors mx-auto"
              aria-label="Expandir sidebar"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className="p-2 space-y-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-150 relative
                ${isActive 
                  ? 'bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-primary before:rounded-r' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                }
              `}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info + Login/Logout - Bottom */}
        <div className="p-2 border-t border-gray-100">
          {/* Admin name display */}
          {!isCollapsed && (
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate" title={adminName}>
                    {adminName}
                  </p>
                  <p className="text-xs text-gray-400">Administrador</p>
                </div>
              </div>
            </div>
          )}
          
          {isAuthenticated ? (
            <button
              onClick={logout}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-gray-600 hover:bg-critical/10 hover:text-critical
                transition-all duration-150
              `}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap">Cerrar Sesión</span>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-gray-600 hover:bg-primary/10 hover:text-primary
                transition-all duration-150
              `}
            >
              <LogIn size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap">Iniciar Sesión</span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Contenido Principal */}
      <main
        className={`
          flex-1 transition-all duration-300
          ${isCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        {/* Header móvil (opcional para responsive) */}
        <header className="lg:hidden flex items-center h-16 px-4 bg-surface shadow-sm">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-primary hover:bg-primary/10"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-3 text-lg font-light text-primary">Skills Matrix</h1>
        </header>

        {/* Área de contenido */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
