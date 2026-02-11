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
  User,
  FlaskConical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import LoginModal from '../auth/LoginModal';
import SidebarUser from './SidebarUser';
import DemoBanner from '../common/DemoBanner';

// Skima Brand Assets
import logoFull from '../../assets/skima-full.svg';

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
    { to: '/evolution', icon: TrendingUp, label: 'Evolución' },
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
  const { companyName, adminName, isDemo } = useConfig();
  
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
        {/* Header del Sidebar - Skima Logo */}
        <div className={`
          flex items-center h-16 px-3 border-b border-gray-100
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}>
          {/* Logo with fade transition */}
          <img
            src={logoFull}
            alt="Skima"
            className={`
              h-8 transition-all duration-200 ease-out
              ${isCollapsed ? 'opacity-0 scale-75 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'}
            `}
          />
          {/* Collapse/Expand button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-all duration-200 flex-shrink-0"
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
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

        {/* Demo indicator */}
        {isDemo && (
          <div className="px-2 mb-1">
            <button
              onClick={() => navigate('/setup')}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg
                bg-amber-50 text-amber-700 hover:bg-amber-100
                transition-all duration-150 text-xs font-medium
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Modo Demo - Configurar' : undefined}
            >
              <FlaskConical size={16} className="flex-shrink-0" />
              {!isCollapsed && <span>Modo Demo</span>}
            </button>
          </div>
        )}

        {/* User Info + Login/Logout - Bottom */}
        <div className="mt-auto">
          {isAuthenticated ? (
            <SidebarUser isCollapsed={isCollapsed} />
          ) : (
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => setShowLoginModal(true)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-gray-600 hover:bg-primary/10 hover:text-primary
                  transition-all duration-150
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title="Iniciar Sesión"
              >
                <LogIn size={20} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap font-medium">Iniciar Sesión</span>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Contenido Principal */}
      <main
        className={`
          flex-1 flex flex-col transition-all duration-300
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
          <img src={logoFull} alt="Skima" className="ml-3 h-7 w-auto" />
        </header>

        {/* Demo banner - outside padding, sticky at top */}
        <DemoBanner />

        {/* Área de contenido - flex-1 fills remaining height */}
        <div className="p-6 flex-1">
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
