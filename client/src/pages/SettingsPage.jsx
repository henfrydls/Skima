import { useState } from 'react';
import { Users, Layers, FolderTree, ClipboardCheck } from 'lucide-react';
import CollaboratorsTab from '../components/settings/CollaboratorsTab';
import SkillsTab from '../components/settings/SkillsTab';
import CategoriesTab from '../components/settings/CategoriesTab';
import EvaluationsTab from '../components/settings/EvaluationsTab';

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
 * - Flat tabs (1 nivel, sin sub-navegación)
 * - Progressive disclosure
 * - Inline editing donde posible
 */

const TABS = [
  { id: 'colaboradores', label: 'Colaboradores', icon: Users },
  { id: 'skills', label: 'Skills', icon: Layers },
  { id: 'categorias', label: 'Categorías', icon: FolderTree },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('colaboradores');

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
                onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'colaboradores' && <CollaboratorsTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'categorias' && <CategoriesTab />}
        {activeTab === 'evaluaciones' && <EvaluationsTab />}
      </div>
    </div>
  );
}
