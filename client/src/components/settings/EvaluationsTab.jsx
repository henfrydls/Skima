import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * EvaluationsTab — Evaluar Skills por Colaborador (v2)
 * 
 * UX Improvements:
 * - Segmented controls with descriptive labels
 * - Progressive disclosure for frecuencia
 * - Fixed edge cases in evaluation logic
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
function SkillRow({ skill, evaluation, onChange }) {
  const nivel = evaluation?.nivel ?? 0;
  const frecuencia = evaluation?.frecuencia ?? 'N';
  const criticidad = skill.criticidad || 'I';
  
  const result = evaluarSkill(nivel, frecuencia, criticidad);
  const stateConfig = EVALUATION_STATES[result.estado] || EVALUATION_STATES['COMPETENTE'];

  const critLabel = {
    'C': { text: 'Crítica', class: 'bg-critical/10 text-critical' },
    'I': { text: 'Importante', class: 'bg-warning/10 text-warning' },
    'D': { text: 'Deseable', class: 'bg-gray-100 text-gray-500' },
    'N': { text: 'N/A', class: 'bg-gray-50 text-gray-400' },
  }[criticidad] || { text: 'N/A', class: 'bg-gray-50 text-gray-400' };

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      {/* Skill Name + Criticidad */}
      <div className="col-span-3">
        <span className="text-sm text-gray-800 font-medium">{skill.nombre}</span>
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
function CategoryAccordion({ category, skills, evaluations, onEvaluationChange }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categorySkills = skills.filter(s => s.categoria === category.id);

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
          {categorySkills.map(skill => (
            <SkillRow
              key={skill.id}
              skill={skill}
              evaluation={evaluations[skill.id]}
              onChange={(val) => onEvaluationChange(skill.id, val)}
            />
          ))}
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
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

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
      } catch (err) {
        setError('Error cargando datos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load evaluations when collaborator is selected
  useEffect(() => {
    if (selectedCollaborator) {
      const collabData = collaborators.find(c => c.id === selectedCollaborator);
      if (collabData?.skills) {
        setEvaluations(collabData.skills);
      } else {
        setEvaluations({});
      }
    }
  }, [selectedCollaborator, collaborators]);

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

  // Save evaluations (UI only - mock)
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    // TODO: API call here
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const entries = Object.entries(evaluations);
    let critical = 0, strengths = 0, underutilized = 0, pending = 0;
    
    entries.forEach(([skillId, eval_]) => {
      const skill = skills.find(s => s.id === parseInt(skillId));
      if (!skill) return;
      const result = evaluarSkill(eval_.nivel || 0, eval_.frecuencia || 'N', skill.criticidad || 'I');
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Evaluar a:</label>
          <select
            value={selectedCollaborator || ''}
            onChange={(e) => setSelectedCollaborator(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[250px]"
          >
            <option value="">Seleccionar colaborador...</option>
            {collaborators.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} — {c.rol}</option>
            ))}
          </select>
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
                onEvaluationChange={handleEvaluationChange}
              />
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all
                ${saveSuccess 
                  ? 'bg-competent text-white' 
                  : 'bg-primary text-white hover:bg-primary/90'
                }
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle size={18} />
                  Guardado ✓
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
    </div>
  );
}
