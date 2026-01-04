import { useState, useEffect, useMemo } from 'react';
import { Grid3x3, User, Layers, Loader2, AlertCircle } from 'lucide-react';
import { TransposedMatrixTable } from '../components/matrix';
import { MatrixSkeleton, CollaboratorListSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import CollaboratorList from '../components/matrix/CollaboratorList';
import CollaboratorDrawer from '../components/matrix/CollaboratorDrawer';
import CategoryHealthCard from '../components/matrix/CategoryHealthCard';
import { 
  calculateSparkline, 
  identifyGaps, 
  identifyStrengths, 
  buildPreviousSnapshot 
} from '../lib/skillsLogic';

// Helper: get status color
const getStatusColor = (nivel) => {
  if (nivel >= 3.5) return 'text-primary';
  if (nivel >= 2.5) return 'text-competent';
  return 'text-warning';
};

// Helper: calculate average for a collaborator
const calculateAverage = (skills) => {
  const values = Object.values(skills).map(s => s.nivel);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

// Helper: calculate category averages for a collaborator
// Helper: calculate category averages for a collaborator
const calculateCategoryAverages = (collabSkills, skills, categories, roleProfile = {}) => {
  const result = {};
  categories.forEach(cat => {
    const catSkillIds = skills.filter(s => s.categoria === cat.id).map(s => s.id);
    
    // Filter out N/A skills based on role profile
    const relevantSkillIds = catSkillIds.filter(id => (roleProfile[id] || 'N') !== 'N');

    const levels = relevantSkillIds
      .filter(id => collabSkills[id] && collabSkills[id].nivel > 0)
      .map(id => collabSkills[id].nivel);
      
    result[cat.abrev] = levels.length > 0 
      ? levels.reduce((sum, l) => sum + l, 0) / levels.length 
      : 0;
  });
  return result;
};

// ============================================
// COLLABORATOR LIST VIEW
// ============================================
function CollaboratorListView({ collaborators = [], onSelect }) {
  return (
    <div className="space-y-4 animate-stagger">
      {collaborators.map(col => (
        <button
          key={col.id}
          onClick={() => onSelect(col)}
          className="w-full text-left border border-gray-200 rounded-lg p-6 bg-white 
                     hover:border-primary hover-lift"
        >
          <div className="flex justify-between items-start gap-6 mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">{col.nombre}</h3>
              <p className="text-sm text-gray-500">{col.rol}</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-light ${getStatusColor(col.promedio)}`}>
                {col.promedio.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {col.promedio >= 3.5 ? 'Fortaleza' : col.promedio >= 2.5 ? 'Competente' : 'Requiere atención'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 flex-wrap">
            {Object.entries(col.categorias).map(([key, valor]) => (
              <div key={key} className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{key}</p>
                <p className={`text-sm font-semibold ${getStatusColor(valor)}`}>
                  {valor.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================
// COLLABORATOR DETAIL VIEW
// ============================================
function CollaboratorDetailView({ colaborador, onBack }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-gray-400">Team Matrix</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400">Por Colaborador</span>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-primary">{colaborador.nombre}</span>
        </nav>
        <button 
          onClick={onBack}
          className="mb-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          ← Volver a lista
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-light text-primary mb-2">{colaborador.nombre}</h2>
            <p className="text-lg text-gray-500">{colaborador.rol}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Promedio General</p>
            <p className={`text-5xl font-light ${getStatusColor(colaborador.promedio)}`}>
              {colaborador.promedio.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-light mb-2 ${
            colaborador.brechas.length > 2 ? 'text-critical' : 
            colaborador.brechas.length > 0 ? 'text-warning' : 'text-competent'
          }`}>
            {colaborador.brechas.length > 2 ? 'CRÍTICO' : 
             colaborador.brechas.length > 0 ? 'MODERADO' : 'BAJO'}
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Nivel de Riesgo</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-light text-warning mb-2">{colaborador.brechas.length}</div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Brechas</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-light text-primary mb-2">{colaborador.fortalezas.length}</div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fortalezas</p>
        </div>
      </div>

      {/* Barras Lollipop */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Nivel por Categoría
        </h4>
        <div className="space-y-4">
          {Object.entries(colaborador.categorias).map(([key, valor]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-12 text-sm font-medium text-gray-600">{key}</span>
              <div className="flex-1 relative">
                <div className="h-2 bg-gray-100 rounded-full" />
                <div 
                  className={`absolute top-0 h-2 rounded-full ${
                    valor >= 3.5 ? 'bg-primary' : valor >= 2.5 ? 'bg-competent' : 'bg-warning'
                  }`}
                  style={{ width: `${(valor / 5) * 100}%` }}
                />
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 ${
                    valor >= 3.5 ? 'border-primary' : valor >= 2.5 ? 'border-competent' : 'border-warning'
                  }`}
                  style={{ left: `calc(${(valor / 5) * 100}% - 8px)` }}
                />
              </div>
              <span className={`w-10 text-right text-sm font-semibold ${getStatusColor(valor)}`}>
                {valor.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Brechas y Fortalezas */}
        <div className="flex flex-wrap gap-4 mt-6">
          {colaborador.brechas.length > 0 && (
            <div className="flex-1">
              <h5 className="text-xs text-gray-500 uppercase mb-2">Brechas</h5>
              <div className="flex flex-wrap gap-2">
                {colaborador.brechas.map((b, i) => (
                  <span key={i} className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">{b}</span>
                ))}
              </div>
            </div>
          )}
          {colaborador.fortalezas.length > 0 && (
            <div className="flex-1">
              <h5 className="text-xs text-gray-500 uppercase mb-2">Fortalezas</h5>
              <div className="flex flex-wrap gap-2">
                {colaborador.fortalezas.map((f, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CATEGORY GRID VIEW
// ============================================
function CategoryGridView({ categories = [] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {categories.map(cat => (
        <div 
          key={cat.id}
          className="bg-surface p-6 rounded-lg shadow-sm border border-gray-100 
                     hover:border-primary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">{cat.nombre}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{cat.abrev}</p>
            </div>
            <p className={`text-4xl font-light ${getStatusColor(cat.promedio)}`}>
              {cat.promedio.toFixed(1)}
            </p>
          </div>
          
          <div className="relative mt-4">
            <div className="h-2 bg-gray-100 rounded-full" />
            <div 
              className={`absolute top-0 h-2 rounded-full ${
                cat.promedio >= 3.5 ? 'bg-primary' : cat.promedio >= 2.5 ? 'bg-competent' : 'bg-warning'
              }`}
              style={{ width: `${(cat.promedio / 5) * 100}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-3">
            {cat.promedio >= 3.5 ? 'Fortaleza del equipo' : 
             cat.promedio >= 2.5 ? 'Nivel competente' : 'Requiere desarrollo'}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TEAM MATRIX PAGE - Con pestañas
// ============================================
export default function TeamMatrixPage() {
  const [currentView, setCurrentView] = useState('matriz');
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [data, setData] = useState({ categories: [], skills: [], collaborators: [], roleProfiles: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Error fetching data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Error cargando datos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const { categories, skills, collaborators, roleProfiles } = data;

  // Transform collaborators for list view - enrich with sparklines, gaps, strengths
  const collaboratorsWithAverages = useMemo(() => {
    return collaborators.map(col => ({
      ...col,
      // Use pre-calculated promedio from backend (which already respects Role Profile)
      promedio: col.promedio, 
      categorias: calculateCategoryAverages(col.skills, skills, categories, roleProfiles[col.rol]),
      // Real data from evaluationSessions
      sparkline: calculateSparkline(col.evaluationSessions),
      previousSnapshot: buildPreviousSnapshot(col.evaluationSessions),
      brechas: identifyGaps(col.skills, skills),
      fortalezas: identifyStrengths(col.skills, skills)
    }));
  }, [collaborators, skills, categories, roleProfiles]);

  // Calculate category averages for grid view
  const categoriesWithAverages = useMemo(() => {
    return categories.map(cat => {
      const catSkillIds = skills.filter(s => s.categoria === cat.id).map(s => s.id);
      let total = 0;
      let count = 0;
      collaborators.forEach(col => {
        const profile = roleProfiles?.[col.rol] || {};
        catSkillIds.forEach(skillId => {
          // Strict filtering: Only count if relevant for the role
          const isRelevant = (profile[skillId] || 'N') !== 'N';
          
          if (isRelevant && col.skills[skillId] && col.skills[skillId].nivel > 0) {
            total += col.skills[skillId].nivel;
            count++;
          }
        });
      });
      return {
        ...cat,
        promedio: count > 0 ? total / count : 0
      };
    });
  }, [categories, skills, collaborators]);

  const tabs = [
    { id: 'matriz', label: 'Matriz de Equipo', Icon: Grid3x3 },
    { id: 'colaboradores', label: 'Por Persona', Icon: User },
    { id: 'categorias', label: 'Por Área', Icon: Layers },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={48} className="text-critical mb-4" />
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-primary hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Team Matrix</h1>
        <p className="text-gray-500 mt-1">
          Visualización de competencias del equipo
        </p>
      </div>

      {/* Pestañas de navegación */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentView(tab.id);
                setSelectedColaborador(null);
              }}
              className={`
                flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors
                ${currentView === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.Icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Vista activa */}
      {currentView === 'matriz' && (
        isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <MatrixSkeleton />
          </div>
        ) : (
          collaborators.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200 animate-fade-in">
              <Grid3x3 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Matriz vacía</h3>
              <p className="text-gray-500">No hay datos suficientes para generar la matriz de competencias.</p>
            </div>
          ) : (
            <TransposedMatrixTable 
              categories={categories}
              skills={skills}
              collaborators={collaborators}
              isLoading={isLoading}
            />
          )
        )
      )}
      
      {currentView === 'colaboradores' && (
        isLoading ? <CollaboratorListSkeleton /> : (
          collaboratorsWithAverages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200 animate-fade-in">
              <User size={48} className="mx-auto text-gray-300 mb-4 " />
              <h3 className="text-lg font-medium text-gray-900">No hay colaboradores</h3>
              <p className="text-gray-500">Aún no se han registrado colaboradores en el sistema.</p>
            </div>
          ) : (
            <CollaboratorList 
              collaborators={collaboratorsWithAverages} 
              onSelect={(col) => {
                setSelectedColaborador(col);
                setIsDrawerOpen(true);
              }} 
            />
          )
        )
      )}

      {/* Collaborator Drawer */}
      <CollaboratorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        collaborator={selectedColaborador}
        categories={categories}
      />
      
      {currentView === 'categorias' && (
        isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          categoriesWithAverages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200 animate-fade-in">
              <Layers size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay categorías</h3>
              <p className="text-gray-500">Aún no se han definido áreas o categorías de competencias.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {categoriesWithAverages.map(cat => (
                <CategoryHealthCard 
                  key={cat.id}
                  category={cat}
                  collaborators={collaboratorsWithAverages}
                  skills={skills}
                />
              ))}
            </div>
          )
        )
      )}
    </div>
  );
}

