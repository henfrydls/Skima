import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
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
  X
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

// Nivel options with descriptive labels
const NIVELES = [
  { value: 0, short: '0', label: 'Sin conocimiento', color: 'bg-gray-200 text-gray-600' },
  { value: 1, short: '1', label: 'Conoce teoría', color: 'bg-gray-300 text-gray-700' },
  { value: 2, short: '2', label: 'Con supervisión', color: 'bg-warning/20 text-warning' },
  { value: 3, short: '3', label: 'Autónomo', color: 'bg-competent/20 text-competent' },
  { value: 4, short: '4', label: 'Puede guiar', color: 'bg-primary/20 text-primary' },
  { value: 5, short: '5', label: 'Experto/Referente', color: 'bg-primary text-white' },
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
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
              Descartar cambios
            </button>
            <button 
              onClick={onSave}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Guardar y Salir
            </button>
          </div>
        </div>
      </div>
    </div>
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
  // SIEMPRE considerar nivel 0 + no usa como pendiente de evaluación
  if (nivel === 0 && frecuencia === 'N') {
    return { estado: 'SIN EVALUAR' };
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
function NivelSelector({ value, onChange }) {
  const selected = NIVELES.find(n => n.value === value) || NIVELES[0];
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        {NIVELES.map(n => (
          <button
            key={n.value}
            onClick={() => onChange(n.value)}
            title={n.label}
            className={`
              px-2 py-1.5 text-xs font-medium transition-all first:rounded-l last:rounded-r
              ${value === n.value 
                ? n.color + ' ring-2 ring-offset-1 ring-primary/30' 
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
function FrecuenciaSelector({ value, onChange }) {
  const selected = FRECUENCIAS.find(f => f.value === value) || FRECUENCIAS[4];
  
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
function SkillRow({ skill, evaluation, criticidad, onChange }) {
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
          onChange={(n) => onChange({ nivel: n, frecuencia })} 
        />
      </div>

      {/* Frecuencia Selector */}
      <div className="col-span-2">
        <FrecuenciaSelector 
          value={frecuencia} 
          onChange={(f) => onChange({ nivel, frecuencia: f })} 
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
function CategoryAccordion({ category, skills, evaluations, roleProfile, onEvaluationChange }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categorySkills = skills.filter(s => s.categoria === category.id);
  
  // Separate N/A skills to show them at the end (collapsed by default)
  const activeSkills = categorySkills.filter(s => (roleProfile?.[s.id] || 'I') !== 'N');
  const naSkills = categorySkills.filter(s => (roleProfile?.[s.id]) === 'N');

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

// Main Component
export default function EvaluationsTab() {
  const { getHeaders } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [roleProfiles, setRoleProfiles] = useState({});
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
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
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle blocker state
  useEffect(() => {
    if (blocker.state === "blocked") {
      setPendingNavigation({ type: 'route', target: null });
      setShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/data`);
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
    fetchData();
  }, []);

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

  // Get current role's profile
  const currentRoleProfile = useMemo(() => {
    if (!selectedCollaborator) return {};
    const collab = collaborators.find(c => c.id === selectedCollaborator);
    if (!collab?.rol) return {};
    return roleProfiles[collab.rol] || {};
  }, [selectedCollaborator, collaborators, roleProfiles]);

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
                
                {/* Role Profile Status */}
                <div className="flex items-center gap-1.5 text-sm">
                  {hasRoleProfile ? (
                    <>
                      <CheckCircle size={14} className="text-competent" />
                      <span className="text-competent">Perfil configurado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} className="text-gray-400" />
                      <span className="text-gray-400">Sin perfil</span>
                    </>
                  )}
                </div>
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

      {/* Evaluation Form */}
      {selectedCollaborator && (
        <>

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

          {/* Evaluation History */}
          {evaluationHistory.length > 0 && (
            <div className="bg-surface rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={18} className="text-gray-400" />
                <h4 className="font-medium text-gray-800">Historial de Evaluaciones</h4>
                <span className="text-xs text-gray-400">({evaluationHistory.length})</span>
              </div>
              <div className="space-y-2">
                {evaluationHistory.slice(0, 5).map(session => (
                  <div 
                    key={session.uuid} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {formatDate(session.evaluatedAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.evaluatedBy || 'Admin'} • {session.assessmentCount} skills
                        </p>
                      </div>
                    </div>
                    <a 
                      href={`/evaluations/${session.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Ver <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
                {evaluationHistory.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-2">
                    +{evaluationHistory.length - 5} evaluaciones anteriores
                  </p>
                )}
              </div>
            </div>
          )}

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
