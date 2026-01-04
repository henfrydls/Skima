import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Users, Layers, FolderTree, ClipboardCheck, Briefcase, AlertTriangle, X, UserCog } from 'lucide-react';
import CollaboratorsTab from '../components/settings/CollaboratorsTab';
import SkillsTab from '../components/settings/SkillsTab';
import CategoriesTab from '../components/settings/CategoriesTab';
import EvaluationsTab from '../components/settings/EvaluationsTab';
import RoleProfilesTab from '../components/settings/RoleProfilesTab';
import ProfileSettings from '../components/settings/ProfileSettings';

/**
 * SettingsPage — Gestión de Maestros del Sistema
 * 
 * Tabs:
 * - Colaboradores: CRUD de personas del equipo
 * - Skills: CRUD de habilidades con rúbricas
 * - Categorías: Drag & drop para organizar
 * - Evaluaciones: Evaluar skills por colaborador
 * 
 * UX Principles Applied:
 * - URL-driven state for deep linking
 * - Keep Alive pattern for performance
 * - Progressive disclosure
 */

const TABS = [
  { id: 'perfil', label: 'Mi Perfil', icon: UserCog },
  { id: 'categorias', label: 'Categorías', icon: FolderTree },
  { id: 'skills', label: 'Skills', icon: Layers },
  { id: 'perfiles', label: 'Perfiles de Puesto', icon: Briefcase },
  { id: 'colaboradores', label: 'Colaboradores', icon: Users },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active tab from URL or default to 'perfil'
  const activeTab = searchParams.get('tab') || 'perfil';
  
  const [navigationContext, setNavigationContext] = useState(null);
  // Track which tabs have been mounted at least once to lazy load them
  const [mountedTabs, setMountedTabs] = useState([activeTab]);
  // Track if RoleProfilesTab has unsaved changes
  const [roleProfilesDirty, setRoleProfilesDirty] = useState(false);
  // Pending tab change when there are unsaved changes
  const [pendingTab, setPendingTab] = useState(null);
  // Data version - increments when role profiles change to trigger refetch in other tabs
  const [dataVersion, setDataVersion] = useState(0);

  // Update mounted tabs when active tab changes
  useEffect(() => {
    if (!mountedTabs.includes(activeTab)) {
      setMountedTabs(prev => [...prev, activeTab]);
    }
  }, [activeTab, mountedTabs]);

  const handleTabChange = (tabId) => {
    // Block if leaving RoleProfiles with unsaved changes
    if (activeTab === 'perfiles' && roleProfilesDirty && tabId !== 'perfiles') {
      setPendingTab(tabId);
      return;
    }
    setSearchParams({ tab: tabId });
    setNavigationContext(null);
  };

  const handleNavigate = (tabId, context = null) => {
    setNavigationContext(context);
    // If navigating to perfiles with a rol context, include it in URL
    if (tabId === 'perfiles' && context?.rol) {
      setSearchParams({ tab: tabId, rol: context.rol });
    } else {
      setSearchParams({ tab: tabId });
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1>Configuración</h1>
        <p className="text-gray-500 mt-1">
          Gestiona colaboradores, skills, categorías y evaluaciones
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content - Keep Alive Pattern */}
      <div className="min-h-[400px]">
        
        {mountedTabs.includes('perfil') && (
          <div className={activeTab === 'perfil' ? 'block' : 'hidden'}>
            <ProfileSettings />
          </div>
        )}
        
        {mountedTabs.includes('categorias') && (
          <div className={activeTab === 'categorias' ? 'block' : 'hidden'}>
            <CategoriesTab isActive={activeTab === 'categorias'} />
          </div>
        )}
        
        {mountedTabs.includes('skills') && (
          <div className={activeTab === 'skills' ? 'block' : 'hidden'}>
             <SkillsTab isActive={activeTab === 'skills'} />
          </div>
        )}

        {mountedTabs.includes('perfiles') && (
          <div className={activeTab === 'perfiles' ? 'block' : 'hidden'}>
            <RoleProfilesTab 
              isActive={activeTab === 'perfiles'} 
              onDirtyChange={setRoleProfilesDirty}
              onDataChange={() => setDataVersion(v => v + 1)}
            />
          </div>
        )}

        {mountedTabs.includes('colaboradores') && (
          <div className={activeTab === 'colaboradores' ? 'block' : 'hidden'}>
            <CollaboratorsTab onNavigate={handleNavigate} isActive={activeTab === 'colaboradores'} dataVersion={dataVersion} />
          </div>
        )}

        {mountedTabs.includes('evaluaciones') && (
          <div className={activeTab === 'evaluaciones' ? 'block' : 'hidden'}>
            <EvaluationsTab initialContext={navigationContext} isActive={activeTab === 'evaluaciones'} dataVersion={dataVersion} />
          </div>
        )}
      </div>

      {/* Unsaved Changes Dialog - Portal to body for full screen coverage */}
      {pendingTab && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 border-l-4 border-warning">
            <div className="p-6">
              <div className="flex items-center gap-3 text-warning mb-2">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-medium text-gray-900">Cambios sin guardar</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Tienes modificaciones pendientes en el perfil de puesto. Si sales ahora, perderás los cambios.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setPendingTab(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setRoleProfilesDirty(false);
                    setSearchParams({ tab: pendingTab });
                    setPendingTab(null);
                  }}
                  className="px-4 py-2 text-critical hover:bg-critical/10 rounded-lg transition-colors"
                >
                  Descartar cambios
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
