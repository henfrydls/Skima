import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBlocker, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Info,
  Calendar,
  Clock,
  History,
  FileText,
  ExternalLink,
  AlertTriangle,
  X,
  ArrowLeft,
  Calendar as CalendarIcon,
  Edit3,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * EvaluationsTab — Evaluar Skills por Colaborador (v2)
 * 
 * UX Improvements:
 * - Segmented controls with descriptive labels
 * - Progressive disclosure for frecuencia
 * - Fixed edge cases in evaluation logic
 * - Freshness indicator for last evaluation date
 */

const API_BASE = '/api';

// Nivel options with descriptive labels - More vibrant colors for visibility
const NIVELES = [
  { value: 0, short: '0', label: 'Sin conocimiento', color: 'bg-gray-400 text-white' },
  { value: 1, short: '1', label: 'Conoce teoría', color: 'bg-gray-500 text-white' },
  { value: 2, short: '2', label: 'Con supervisión', color: 'bg-amber-500 text-white' },
  { value: 3, short: '3', label: 'Autónomo', color: 'bg-emerald-500 text-white' },
  { value: 4, short: '4', label: 'Puede guiar', color: 'bg-blue-500 text-white' },
  { value: 5, short: '5', label: 'Experto/Referente', color: 'bg-purple-600 text-white' },
];

// Frecuencia options with clear labels
const FRECUENCIAS = [
  { value: 'D', label: 'Diaria', desc: 'Usa esta skill todos los días' },
  { value: 'S', label: 'Semanal', desc: 'Varias veces por semana' },
  { value: 'M', label: 'Mensual', desc: 'Algunas veces al mes' },
  { value: 'T', label: 'Trimestral', desc: 'Pocas veces al año' },
  { value: 'N', label: 'No usa', desc: 'No aplica esta skill actualmente' },
];

// Evaluation states with descriptions
const EVALUATION_STATES = {
  'SIN EVALUAR': { color: 'bg-gray-100 text-gray-500', icon: '○', action: 'Completar evaluación' },
  'SIN EXPERIENCIA': { color: 'bg-gray-300 text-gray-700', icon: '—', action: 'Evaluar necesidad de capacitación' },
  'BRECHA CRÍTICA': { color: 'bg-critical text-white', icon: '!', action: 'Capacitación urgente' },
  'ÁREA DE MEJORA': { color: 'bg-warning text-white', icon: '↗', action: 'Plan de desarrollo' },
  'TALENTO SUBUTILIZADO': { color: 'bg-purple-500 text-white', icon: '◇', action: 'Reasignar proyectos' },
  'EN DESARROLLO': { color: 'bg-gray-400 text-white', icon: '→', action: 'Continuar práctica' },
  'COMPETENTE': { color: 'bg-gray-500 text-white', icon: '✓', action: 'Mantener nivel' },
  'FORTALEZA': { color: 'bg-primary text-white', icon: '★', action: 'Potenciar como referente' },
  'FORTALEZA CLAVE': { color: 'bg-competent text-white', icon: '★★', action: 'Compartir conocimiento' },
  'BÁSICO': { color: 'bg-gray-300 text-gray-700', icon: '·', action: 'Opcional según intereses' },
  'NO APLICA': { color: 'bg-gray-100 text-gray-400', icon: '—', action: 'Skill no relevante para este rol' },
};

// Unsaved Changes Dialog
function UnsavedChangesDialog({ isOpen, onDiscard, onCancel, onSave }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 border-l-4 border-warning">
        <div className="p-6">
          <div className="flex items-center gap-3 text-warning mb-2">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-medium text-gray-900">Cambios sin guardar</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Tienes modificaciones pendientes en esta evaluación. Si sales ahora, perderás los cambios.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={onDiscard}
              className="px-4 py-2 text-critical hover:bg-critical/10 rounded-lg transition-colors"
            >
              Descartar
            </button>
            <button 
              onClick={onSave}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Freshness helper - calculates how fresh an evaluation is
 */
function getFreshness(lastEvaluatedDate) {
  if (!lastEvaluatedDate) {
    return { status: 'never', label: 'Sin evaluar', color: 'bg-gray-100 text-gray-500', days: null };
  }
  
  const now = new Date();
  const lastDate = new Date(lastEvaluatedDate);
  const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return { status: 'fresh', label: 'Reciente', color: 'bg-competent/20 text-competent', days: diffDays };
  } else if (diffDays < 90) {
    return { status: 'aging', label: `Hace ${diffDays} días`, color: 'bg-warning/20 text-warning', days: diffDays };
  } else {
    return { status: 'stale', label: '⚠ Desactualizada', color: 'bg-critical/20 text-critical', days: diffDays };
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Evaluation logic - FIXED edge cases
 */
function evaluarSkill(nivel, frecuencia, criticidad) {
  // Handle nivel 0 + no usa based on criticality
  if (nivel === 0 && frecuencia === 'N') {
    if (criticidad === 'C') return { estado: 'BRECHA CRÍTICA' }; // Critical skill not developed
    if (criticidad === 'N') return { estado: 'NO APLICA' }; // Not relevant
    return { estado: 'SIN EXPERIENCIA' }; // Important/Desirable but no experience
  }
  
  if (nivel === 0) {
    // Nivel 0 with any frequency = problem if skill is critical/important
    if (criticidad === 'C') return { estado: 'BRECHA CRÍTICA' };
    if (criticidad === 'I') return { estado: 'ÁREA DE MEJORA' };
    return { estado: 'BÁSICO' };
  }

  if (frecuencia === 'N') {
    // Has skill but never uses it
    if (nivel >= 4) return { estado: 'TALENTO SUBUTILIZADO' };
    return { estado: criticidad === 'N' ? 'NO APLICA' : 'BÁSICO' };
  }

  // BRECHA CRÍTICA: Critical + frequent use + low level
  if (criticidad === 'C' && ['D', 'S'].includes(frecuencia) && nivel < 3) {
    return { estado: 'BRECHA CRÍTICA' };
  }
  
  // ÁREA DE MEJORA: Critical + less frequent + low level
  if (criticidad === 'C' && ['M', 'T'].includes(frecuencia) && nivel < 3) {
    return { estado: 'ÁREA DE MEJORA' };
  }
  
  // FORTALEZA CLAVE: Critical + frequent + high level
  if (criticidad === 'C' && ['D', 'S'].includes(frecuencia) && nivel >= 4) {
    return { estado: 'FORTALEZA CLAVE' };
  }
  
  // ÁREA DE MEJORA: Important + frequent use + low level (needs attention!)
  if (criticidad === 'I' && ['D', 'S'].includes(frecuencia) && nivel < 3) {
    return { estado: 'ÁREA DE MEJORA' };
  }
  
  // EN DESARROLLO: Important/Desirable + mid level (not urgent, progressing)
  if (['I', 'D'].includes(criticidad) && nivel >= 2 && nivel < 3) {
    return { estado: 'EN DESARROLLO' };
  }
  
  // COMPETENTE: Adequate level for the role
  if (['C', 'I'].includes(criticidad) && nivel >= 3 && nivel < 4) {
    return { estado: 'COMPETENTE' };
  }
  
  // FORTALEZA: High level in important skills
  if (['C', 'I'].includes(criticidad) && nivel >= 4) {
    return { estado: 'FORTALEZA' };
  }
  
  // BÁSICO: Low level in non-critical skills
  if (nivel < 3 && ['D', 'N'].includes(criticidad)) {
    return { estado: 'BÁSICO' };
  }
  
  // Default
  return { estado: nivel >= 3 ? 'COMPETENTE' : 'EN DESARROLLO' };
}

// Nivel Selector with descriptive segmented control
function NivelSelector({ value, onChange, readOnly = false }) {
  const selected = NIVELES.find(n => n.value === value) || NIVELES[0];
  
  if (readOnly) {
    return (
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        ${selected.color}
      `}>
        <span className="w-5 h-5 flex items-center justify-center rounded bg-black/10 text-[10px]">{selected.short}</span>
        {selected.label}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        {NIVELES.map(n => (
          <button
            key={n.value}
            onClick={() => onChange(n.value)}
            title={n.label}
            className={`
              px-3 py-1.5 text-xs font-medium transition-all rounded
              ${value === n.value 
                ? n.color + ' ring-2 ring-offset-1 ring-primary/30 z-10 relative' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            {n.short}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-500 italic">{selected.label}</span>
    </div>
  );
}

// Frecuencia Selector dropdown
function FrecuenciaSelector({ value, onChange, readOnly = false }) {
  const selected = FRECUENCIAS.find(f => f.value === value) || FRECUENCIAS[4];
  
  if (readOnly) {
    return (
      <span className="text-sm text-gray-700 font-medium px-2 py-1 bg-gray-50 rounded border border-gray-100">
        {selected.label}
      </span>
    );
  }
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      title={selected.desc}
    >
      {FRECUENCIAS.map(f => (
        <option key={f.value} value={f.value}>{f.label}</option>
      ))}
    </select>
  );
}

// Skill Evaluation Row
function SkillRow({ skill, evaluation, criticidad, onChange, readOnly = false }) {
  const nivel = evaluation?.nivel ?? 0;
  const frecuencia = evaluation?.frecuencia ?? 'N';
  const effectiveCriticidad = criticidad || 'I';
  
  const result = evaluarSkill(nivel, frecuencia, effectiveCriticidad);
  const stateConfig = EVALUATION_STATES[result.estado] || EVALUATION_STATES['COMPETENTE'];
  const isNA = effectiveCriticidad === 'N';

  const critLabel = {
    'C': { text: 'Crítica', class: 'bg-critical/10 text-critical' },
    'I': { text: 'Importante', class: 'bg-warning/10 text-warning' },
    'D': { text: 'Deseable', class: 'bg-gray-100 text-gray-500' },
    'N': { text: 'N/A', class: 'bg-gray-50 text-gray-400' },
  }[effectiveCriticidad] || { text: 'N/A', class: 'bg-gray-50 text-gray-400' };

  return (
    <div className={`grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isNA ? 'opacity-50' : ''}`}>
      {/* Skill Name + Criticidad */}
      <div className="col-span-3">
        <span className={`text-sm font-medium ${isNA ? 'text-gray-400' : 'text-gray-800'}`}>{skill.nombre}</span>
        <div className="mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded ${critLabel.class}`}>
            {critLabel.text}
          </span>
        </div>
      </div>

      {/* Nivel Selector */}
      <div className="col-span-4">
        <NivelSelector 
          value={nivel} 
          onChange={(n) => !readOnly && onChange({ nivel: n, frecuencia })} 
          readOnly={readOnly}
        />
      </div>

      {/* Frecuencia Selector */}
      <div className="col-span-2">
        <FrecuenciaSelector 
          value={frecuencia} 
          onChange={(f) => !readOnly && onChange({ nivel, frecuencia: f })} 
          readOnly={readOnly}
        />
      </div>

      {/* Result State */}
      <div className="col-span-3 flex items-center justify-end gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stateConfig.color}`}>
          {stateConfig.icon} {result.estado}
        </span>
      </div>
    </div>
  );
}

// Category Accordion
function CategoryAccordion({ category, skills, evaluations, roleProfile, onEvaluationChange, showCategoryAverage = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categorySkills = skills.filter(s => s.categoria === category.id);
  
  // Separate N/A skills to show them at the end (collapsed by default)
  const activeSkills = categorySkills.filter(s => (roleProfile?.[s.id] || 'I') !== 'N');
  const naSkills = categorySkills.filter(s => (roleProfile?.[s.id]) === 'N');

  // Calculate category average (only evaluated skills with nivel > 0)
  const categoryAverage = useMemo(() => {
    let total = 0;
    let count = 0;
    activeSkills.forEach(skill => {
      const eval_ = evaluations[skill.id];
      if (eval_?.nivel && eval_.nivel > 0) {
        total += eval_.nivel;
        count++;
      }
    });
    return count > 0 ? (total / count).toFixed(1) : null;
  }, [activeSkills, evaluations]);

  if (categorySkills.length === 0) return null;

  return (
    <div className="bg-surface rounded-lg border border-gray-100 overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
          <span className="font-medium text-gray-800">{category.nombre}</span>
          <span className="text-xs text-gray-400">({categorySkills.length} skills)</span>
        </div>
        
        {/* Category Average Badge */}
        {showCategoryAverage && categoryAverage && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Promedio:</span>
            <span className={`
              text-sm font-medium px-2 py-0.5 rounded
              ${parseFloat(categoryAverage) >= 3.5 ? 'bg-competent/10 text-competent' : 
                parseFloat(categoryAverage) >= 2.5 ? 'bg-warning/10 text-warning' : 
                'bg-critical/10 text-critical'}
            `}>
              {categoryAverage}
            </span>
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="col-span-3">Skill</div>
            <div className="col-span-4">Nivel de Competencia</div>
            <div className="col-span-2">Frecuencia</div>
            <div className="col-span-3 text-right">Estado</div>
          </div>
          {activeSkills.map(skill => (
            <SkillRow
              key={skill.id}
              skill={skill}
              evaluation={evaluations[skill.id]}
              criticidad={roleProfile?.[skill.id] || skill.criticidad || 'I'}
              onChange={(val) => onEvaluationChange(skill.id, val)}
              readOnly={!!onEvaluationChange === false}
            />
          ))}
          {naSkills.length > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
              {naSkills.length} skill(s) marcadas como N/A para este rol
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Legend Panel
function EvaluationLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <HelpCircle size={16} />
        Guía de Evaluación
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[420px] bg-surface rounded-lg shadow-xl border border-gray-100 p-4 z-20">
            <h4 className="font-medium text-gray-800 mb-3">Sistema de Evaluación</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Niveles:</h5>
                <div className="space-y-1">
                  {NIVELES.map(n => (
                    <div key={n.value} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded text-xs flex items-center justify-center ${n.color}`}>{n.short}</span>
                      <span className="text-gray-600">{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Frecuencias:</h5>
                <div className="space-y-1">
                  {FRECUENCIAS.map(f => (
                    <div key={f.value} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-gray-100 text-xs flex items-center justify-center text-gray-600">{f.value}</span>
                      <span className="text-gray-600">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h5 className="font-medium text-gray-700 mt-4 mb-2">Estados resultantes:</h5>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(EVALUATION_STATES).slice(1, 9).map(([estado, config]) => (
                <div key={estado} className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color}`}>{config.icon}</span>
                  <span className="text-xs text-gray-600">{estado}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// Session Detail View Component
function SessionDetailView({ uuid, onBack, categories, skills }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/evaluations/${uuid}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [uuid]);

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (!session) {
    return <div className="p-8 text-center text-critical">Error cargando la evaluación.</div>;
  }

  // Transform skills object (from API) to evaluationsMap and storedRoleProfile
  // API returns skills as object keyed by skillId: { [skillId]: { nivel, frecuencia, criticidad, ... } }
  const evaluationsMap = {};
  const storedRoleProfile = {};
  
  if (session.skills && typeof session.skills === 'object') {
    Object.entries(session.skills).forEach(([skillId, data]) => {
      evaluationsMap[skillId] = { 
        nivel: data.nivel, 
        frecuencia: data.frecuencia,
        criticidad: data.criticidad 
      };
      // Use stored criticidad for role profile
      storedRoleProfile[skillId] = data.criticidad || 'I';
    });
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-lg font-medium text-gray-800">
            Evaluación del {formatDate(session.evaluatedAt)}
          </h3>
          <p className="text-sm text-gray-500">
            Realizada por {session.evaluatedBy || 'Admin'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <CategoryAccordion
            key={category.id}
            category={category}
            skills={skills}
            evaluations={evaluationsMap}
            roleProfile={storedRoleProfile} // Use stored criticidad from snapshot
            onEvaluationChange={null} // Read-only trigger
            showCategoryAverage={true}
          />
        ))}
      </div>
    </div>
  );
}

// Main Component
export default function EvaluationsTab({ initialContext, isActive = false }) {
  const { getHeaders } = useAuth();
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [roleProfiles, setRoleProfiles] = useState({});
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'history', 'details'
  const [selectedSessionUuid, setSelectedSessionUuid] = useState(null);
  
  const [evaluations, setEvaluations] = useState({});
  const [initialEvaluations, setInitialEvaluations] = useState({}); // For dirty checking
  
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedUuid, setLastSavedUuid] = useState(null);
  const [error, setError] = useState(null);
  
  // Navigation blocking state
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Compare evaluations to check if dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(evaluations) !== JSON.stringify(initialEvaluations);
  }, [evaluations, initialEvaluations]);

  // React Router Blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && (
        currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search
      )
  );

  // Handle blocker state
  useEffect(() => {
    if (blocker.state === "blocked") {
      setPendingNavigation({ type: 'route', target: null });
      setShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  // Fetch data
  // Fetch data function
  const fetchData = async () => {
    try {
      // Don't show loading on background refresh unless empty
      if (collaborators.length === 0) setIsLoading(true);
      
      const response = await fetch(`${API_BASE}/data?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Error fetching data');
      const data = await response.json();
      
      setCollaborators(data.collaborators || []);
      setCategories(data.categories || []);
      setSkills(data.skills || []);
      setRoleProfiles(data.roleProfiles || {});
    } catch (err) {
      setError('Error cargando datos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch when tab becomes active
  useEffect(() => {
    if (isActive) {
      fetchData();
    }
  }, [isActive]);

  // Load evaluations and history when collaborator is selected
  useEffect(() => {
    if (selectedCollaborator) {
      const collabData = collaborators.find(c => c.id === selectedCollaborator);
      const loadedEvals = collabData?.skills || {};
      
      setEvaluations(loadedEvals);
      setInitialEvaluations(loadedEvals); // Set baseline
      
      // Fetch evaluation history
      const fetchHistory = async () => {
        try {
          const response = await fetch(`${API_BASE}/collaborators/${selectedCollaborator}/evaluations`);
          if (response.ok) {
            const history = await response.json();
            setEvaluationHistory(history);
          }
        } catch (err) {
          console.error('Error fetching evaluation history:', err);
        }
      };
      fetchHistory();
    } else {
      setEvaluationHistory([]);
      setEvaluations({});
      setInitialEvaluations({});
    }
  }, [selectedCollaborator, collaborators]);

  // Handle initial context navigation (e.g. from Collaborators Tab)
  useEffect(() => {
    if (initialContext) {
      if (initialContext.collaboratorId) {
        // Ensure type consistency (string vs number)
        const targetId = typeof collaborators[0]?.id === 'number' 
          ? Number(initialContext.collaboratorId) 
          : initialContext.collaboratorId;
          
        setSelectedCollaborator(targetId);
      }
      if (initialContext.view) {
        setViewMode(initialContext.view);
      }
    }
  }, [initialContext, collaborators]);

  // Get current role's profile
  const currentRoleProfile = useMemo(() => {
    if (!selectedCollaborator) return {};
    const collab = collaborators.find(c => c.id === selectedCollaborator);
    if (!collab?.rol) return {};
    return roleProfiles[collab.rol] || {};
  }, [selectedCollaborator, collaborators, roleProfiles]);

  // Check if the role has any valid skills defined (not N/A)
  const hasValidProfile = useMemo(() => {
    const profileValues = Object.values(currentRoleProfile);
    if (profileValues.length === 0) return false;
    // Has valid profile if at least one skill is NOT 'N/A'
    return profileValues.some(v => v !== 'N/A');
  }, [currentRoleProfile]);

  // Handle evaluation change
  const handleEvaluationChange = (skillId, value) => {
    setEvaluations(prev => ({
      ...prev,
      [skillId]: {
        ...(prev[skillId] || {}),
        nivel: value.nivel,
        frecuencia: value.frecuencia,
        criticidad: skills.find(s => s.id === skillId)?.criticidad || 'I'
      }
    }));
    setSaveSuccess(false);
  };

  // Save evaluations to API
  const handleSave = async (shouldNavigateAfter = false) => {
    if (!selectedCollaborator) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setLastSavedUuid(null);
    
    try {
      const response = await fetch(`${API_BASE}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({
          collaboratorId: selectedCollaborator,
          evaluatedBy: 'Admin',
          notes: null,
          skills: evaluations
        })
      });
      
      if (!response.ok) {
        throw new Error('Error saving evaluation');
      }
      
      const result = await response.json();
      setLastSavedUuid(result.uuid);
      setSaveSuccess(true);
      setInitialEvaluations(evaluations); // Update baseline
      
      // Refresh history
      const historyResponse = await fetch(`${API_BASE}/collaborators/${selectedCollaborator}/evaluations`);
      if (historyResponse.ok) {
        const history = await historyResponse.json();
        setEvaluationHistory(history);
      }
      
      // Update lastEvaluated in local state
      setCollaborators(prev => prev.map(c => 
        c.id === selectedCollaborator 
          ? { ...c, lastEvaluated: new Date().toISOString() }
          : c
      ));
      
      setTimeout(() => setSaveSuccess(false), 5000);

      // Handle navigation after save
      if (shouldNavigateAfter) {
        setShowUnsavedDialog(false);
        if (pendingNavigation?.type === 'collaborator') {
          setSelectedCollaborator(pendingNavigation.target);
        } else if (pendingNavigation?.type === 'route' && blocker.state === "blocked") {
          blocker.proceed();
        }
        setPendingNavigation(null);
      }

    } catch (err) {
      console.error('Error saving evaluation:', err);
      setError('Error guardando evaluación');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Safe Collaborator Switch
  const handleCollaboratorSwitch = (collabId) => {
    const target = collabId ? parseInt(collabId) : null;
    
    if (isDirty) {
      setPendingNavigation({ type: 'collaborator', target });
      setShowUnsavedDialog(true);
    } else {
      setSelectedCollaborator(target);
    }
  };

  // Unsaved Dialog Actions
  const handleDiscardChanges = () => {
    setEvaluations(initialEvaluations); // Revert
    setShowUnsavedDialog(false);
    
    if (pendingNavigation?.type === 'collaborator') {
      setSelectedCollaborator(pendingNavigation.target);
    } else if (pendingNavigation?.type === 'route' && blocker.state === "blocked") {
      blocker.proceed();
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setPendingNavigation(null);
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const entries = Object.entries(evaluations);
    let critical = 0, strengths = 0, underutilized = 0, pending = 0;
    
    entries.forEach(([skillId, eval_]) => {
      const skill = skills.find(s => s.id === parseInt(skillId));
      if (!skill) return;
      const crit = currentRoleProfile[skill.id] || skill.criticidad || 'I';
      if (crit === 'N') return; // Skip N/A skills
      const result = evaluarSkill(eval_.nivel || 0, eval_.frecuencia || 'N', crit);
      if (result.estado === 'BRECHA CRÍTICA') critical++;
      if (result.estado.includes('FORTALEZA')) strengths++;
      if (result.estado === 'TALENTO SUBUTILIZADO') underutilized++;
      if (result.estado === 'SIN EVALUAR') pending++;
    });
    
    return { critical, strengths, underutilized, pending, total: entries.length };
  }, [evaluations, skills]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={48} className="text-critical mb-4" />
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  // Empty state
  if (collaborators.length === 0) {
    return (
      <div className="text-center py-16">
        <Info size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">No hay colaboradores</h3>
        <p className="text-gray-500">Primero crea colaboradores en la pestaña correspondiente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with inline status badges */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Evaluar a:</label>
          <select
            value={selectedCollaborator || ''}
            onChange={(e) => handleCollaboratorSwitch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[250px]"
          >
            <option value="">Seleccionar colaborador...</option>
            {collaborators.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} — {c.rol}</option>
            ))}
          </select>
          
          {/* Inline Status Badges - only show when collaborator selected */}
          {selectedCollaborator && (() => {
            const collab = collaborators.find(c => c.id === selectedCollaborator);
            const freshness = getFreshness(collab?.lastEvaluated);
            const hasRoleProfile = collab?.rol && Object.keys(currentRoleProfile).length > 0;
            
            return (
              <div className="flex items-center gap-3">
                {/* Freshness Badge */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-500">{formatDate(collab?.lastEvaluated)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${freshness.color}`}>
                    {freshness.label}
                  </span>
                </div>
                
                {/* Separator */}
                <span className="text-gray-200">|</span>
                
                {/* History Toggle Button */}
                <button
                  onClick={() => setViewMode(viewMode === 'edit' ? 'history' : 'edit')}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {viewMode === 'edit' ? (
                    <>
                      <History size={16} />
                      Ver Historial
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} />
                      Volver a Edición
                    </>
                  )}
                </button>
              </div>
            );
          })()}
        </div>

        <EvaluationLegend />
      </div>

      {/* No collaborator selected */}
      {!selectedCollaborator && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Selecciona un colaborador</h3>
          <p className="text-gray-500 mt-1">Elige a quién deseas evaluar del menú superior.</p>
        </div>
      )}

      {/* Evaluation Form / History / Details Switch */}
      {selectedCollaborator && (
        <>
          {viewMode === 'edit' && !hasValidProfile && (
            <div className="text-center py-16 bg-amber-50 rounded-lg border border-amber-200">
              <Briefcase size={48} className="mx-auto text-amber-400 mb-4" />
              <h3 className="text-lg font-medium text-amber-800 mb-2">
                Perfil de puesto sin configurar
              </h3>
              <p className="text-amber-600 max-w-md mx-auto mb-4">
                El rol "{collaborators.find(c => c.id === selectedCollaborator)?.rol}" no tiene skills definidas.
                Configura primero las skills requeridas en la pestaña "Perfiles de Puesto".
              </p>
              <button
                onClick={() => {
                  const rolName = collaborators.find(c => c.id === selectedCollaborator)?.rol;
                  navigate(`/settings?tab=perfiles&rol=${encodeURIComponent(rolName || '')}`);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Ir a Perfiles de Puesto
              </button>
            </div>
          )}
          
          {viewMode === 'edit' && hasValidProfile && (
            <div className="animate-fade-in space-y-6">

          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Skills</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-gray-500">{stats.pending}</p>
              <p className="text-xs text-gray-500">Sin Evaluar</p>
            </div>
            <div className="bg-critical/10 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-critical">{stats.critical}</p>
              <p className="text-xs text-gray-500">Brechas Críticas</p>
            </div>
            <div className="bg-competent/10 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-competent">{stats.strengths}</p>
              <p className="text-xs text-gray-500">Fortalezas</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-purple-600">{stats.underutilized}</p>
              <p className="text-xs text-gray-500">Subutilizados</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            {categories.map(category => (
              <CategoryAccordion
                key={category.id}
                category={category}
                skills={skills}
                evaluations={evaluations}
                roleProfile={currentRoleProfile}
                onEvaluationChange={handleEvaluationChange}
              />
            ))}
          </div>


          {/* Sticky Footer for Save Actions - Only visible when dirty */}
          <div 
            className={`
              sticky bottom-2 z-20 flex justify-end gap-3 p-4 rounded-xl shadow-lg border border-gray-100 bg-white/90 backdrop-blur-sm transition-all duration-300
              ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
            `}
          >
            <span className="flex items-center text-sm text-gray-500 mr-auto">
              <AlertCircle size={16} className="mr-2 text-warning" />
              Tienes cambios sin guardar
            </span>

            <button
               onClick={() => setEvaluations(initialEvaluations)}
               className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              Descartar
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Evaluación
                </>
              )}
            </button>
          </div>
          </div>
          )}

          {/* HISTORY VIEW */}
          {viewMode === 'history' && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <button 
                  onClick={() => setViewMode('edit')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-lg font-medium text-gray-800">Historial de Evaluaciones</h3>
              </div>

              {evaluationHistory.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No hay evaluaciones previas para este colaborador.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {evaluationHistory.map(session => (
                    <div 
                      key={session.uuid}
                      className="bg-surface p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Evaluación del {formatDate(session.evaluatedAt)}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>Por: {session.evaluatedBy || 'Admin'}</span>
                            <span>•</span>
                            <span>{session.assessmentCount} skills evaluadas</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedSessionUuid(session.uuid);
                          setViewMode('details');
                        }}
                        className="px-4 py-2 text-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Ver detalles
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DETAILS VIEW */}
          {viewMode === 'details' && selectedSessionUuid && (
            <SessionDetailView 
              uuid={selectedSessionUuid} 
              onBack={() => {
                setSelectedSessionUuid(null);
                setViewMode('history');
              }}
              categories={categories}
              skills={skills}
            />
          )}

        </>
      )}

      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
        onSave={() => handleSave(true)}
      />
    </div>
  );
}
