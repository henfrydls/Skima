import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Users, Layers, FolderTree, ClipboardCheck, Briefcase } from 'lucide-react';
import CollaboratorsTab from '../components/settings/CollaboratorsTab';
import SkillsTab from '../components/settings/SkillsTab';
import CategoriesTab from '../components/settings/CategoriesTab';
import EvaluationsTab from '../components/settings/EvaluationsTab';
import RoleProfilesTab from '../components/settings/RoleProfilesTab';

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
  
  // Get active tab from URL or default to 'categorias'
  const activeTab = searchParams.get('tab') || 'categorias';
  
  const [navigationContext, setNavigationContext] = useState(null);
  // Track which tabs have been mounted at least once to lazy load them
  const [mountedTabs, setMountedTabs] = useState([activeTab]);

  // Update mounted tabs when active tab changes
  useEffect(() => {
    if (!mountedTabs.includes(activeTab)) {
      setMountedTabs(prev => [...prev, activeTab]);
    }
  }, [activeTab, mountedTabs]);

  const handleTabChange = (tabId) => {
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
            <RoleProfilesTab isActive={activeTab === 'perfiles'} />
          </div>
        )}

        {mountedTabs.includes('colaboradores') && (
          <div className={activeTab === 'colaboradores' ? 'block' : 'hidden'}>
            <CollaboratorsTab onNavigate={handleNavigate} isActive={activeTab === 'colaboradores'} />
          </div>
        )}

        {mountedTabs.includes('evaluaciones') && (
          <div className={activeTab === 'evaluaciones' ? 'block' : 'hidden'}>
            <EvaluationsTab initialContext={navigationContext} isActive={activeTab === 'evaluaciones'} />
          </div>
        )}
      </div>
    </div>
  );
}
