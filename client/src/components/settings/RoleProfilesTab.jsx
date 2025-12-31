import { useState, useEffect, useMemo } from 'react';
import { 
  Users,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Briefcase,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleProfilesTab — Define skill requirements per role (Perfil de Puesto)
 * 
 * UX Focus:
 * - Clear segmented controls for criticality (C/I/D/N/A)
 * - Progressive disclosure with category accordions
 * - Visual feedback on save
 * - Duplicate profile for similar roles
 * - Create new role profiles
 */

const API_BASE = '/api';

// Criticality options with colors and descriptions
const CRITICIDAD_OPTIONS = [
  { value: 'C', label: 'Crítica', short: 'C', color: 'bg-critical text-white', desc: 'Indispensable para el puesto' },
  { value: 'I', label: 'Importante', short: 'I', color: 'bg-warning text-white', desc: 'Necesaria pero no bloqueante' },
  { value: 'D', label: 'Deseable', short: 'D', color: 'bg-gray-400 text-white', desc: 'Nice-to-have, suma puntos' },
  { value: 'N', label: 'N/A', short: '—', color: 'bg-gray-200 text-gray-500', desc: 'No aplica para este rol' },
];

// New Role Modal Component
function NewRoleModal({ isOpen, onClose, onCreateRole, existingRoles }) {
  const [roleName, setRoleName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }
    if (existingRoles.includes(roleName.trim())) {
      setError('Ya existe un perfil para este rol');
      return;
    }
    onCreateRole(roleName.trim());
    setRoleName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Nuevo Perfil de Puesto</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Rol *
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => { setRoleName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ej: Senior Developer, UX Lead..."
              autoFocus
            />
            {error && <p className="text-xs text-critical mt-1">{error}</p>}
          </div>
          <p className="text-xs text-gray-500">
            Después de crear el perfil, podrás definir las skills críticas, importantes y deseables.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              Crear Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Skill row component
function SkillRequirementRow({ skill, value, onChange }) {
  const selected = CRITICIDAD_OPTIONS.find(o => o.value === value) || CRITICIDAD_OPTIONS[3];

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <span className="text-sm text-gray-800 font-medium">{skill.nombre}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {CRITICIDAD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.desc}
            className={`
              flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-[60px]
              ${value === opt.value 
                ? opt.color + ' ring-2 ring-offset-1 ring-primary/30 shadow-sm' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            <span className="text-sm font-bold">{opt.short}</span>
            <span className={`text-[9px] ${value === opt.value ? 'opacity-90' : 'text-gray-400'}`}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Category accordion
function CategorySection({ category, skills, requirements, onRequirementChange }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categorySkills = skills.filter(s => s.categoria === category.id);

  if (categorySkills.length === 0) return null;

  // Count criticalities in this category
  const counts = categorySkills.reduce((acc, skill) => {
    const val = requirements[skill.id] || 'N';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

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
        
        {/* Mini summary badges */}
        <div className="flex items-center gap-1">
          {counts['C'] > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-critical/20 text-critical">{counts['C']}C</span>}
          {counts['I'] > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">{counts['I']}I</span>}
          {counts['D'] > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{counts['D']}D</span>}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Skill</span>
            <span>Importancia para el Rol</span>
          </div>
          {categorySkills.map(skill => (
            <SkillRequirementRow
              key={skill.id}
              skill={skill}
              value={requirements[skill.id] || 'N'}
              onChange={(val) => onRequirementChange(skill.id, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Legend panel
function CriticidadLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <HelpCircle size={16} />
        ¿Qué significa cada nivel?
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-lg shadow-xl border border-gray-100 p-4 z-20">
            <h4 className="font-medium text-gray-800 mb-3">Niveles de Criticidad</h4>
            <div className="space-y-2">
              {CRITICIDAD_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-start gap-3">
                  <span className={`w-8 h-6 rounded text-xs flex items-center justify-center font-semibold ${opt.color}`}>
                    {opt.short}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Main component
export default function RoleProfilesTab() {
  const { getHeaders } = useAuth();
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [requirements, setRequirements] = useState({});
  const [allProfiles, setAllProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);

  // Handler to create new role
  const handleCreateNewRole = (roleName) => {
    setRoles(prev => [...prev, roleName]);
    setSelectedRole(roleName);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/data`);
        if (!response.ok) throw new Error('Error fetching data');
        const data = await response.json();
        
        // Extract unique roles from collaborators
        const uniqueRoles = [...new Set(data.collaborators?.map(c => c.rol) || [])].filter(Boolean);
        setRoles(uniqueRoles);
        setCategories(data.categories || []);
        setSkills(data.skills || []);
        
        // Load existing profiles if any
        setAllProfiles(data.roleProfiles || {});
        
      } catch (err) {
        setError('Error cargando datos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load requirements when role changes - merge with defaults
  useEffect(() => {
    // First create defaults for all skills as 'N' (N/A)
    const defaults = {};
    skills.forEach(s => { defaults[s.id] = 'N'; });
    
    if (selectedRole && allProfiles[selectedRole]) {
      // Merge existing profile over defaults - this ensures all skills have a value
      setRequirements({ ...defaults, ...allProfiles[selectedRole] });
    } else {
      // New role - use all defaults
      setRequirements(defaults);
    }
  }, [selectedRole, allProfiles, skills]);

  // Handle requirement change
  const handleRequirementChange = (skillId, value) => {
    setRequirements(prev => ({
      ...prev,
      [skillId]: value
    }));
    setSaveSuccess(false);
  };

  // Duplicate profile from another role
  const handleDuplicate = (sourceRole) => {
    if (allProfiles[sourceRole]) {
      setRequirements({ ...allProfiles[sourceRole] });
      setSaveSuccess(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!selectedRole) return;
    
    setIsSaving(true);
    try {
      // Call API to persist
      const response = await fetch(`${API_BASE}/role-profiles/${encodeURIComponent(selectedRole)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify(requirements)
      });
      
      if (!response.ok) {
        throw new Error('Error saving profile');
      }
      
      // Update local state
      setAllProfiles(prev => ({
        ...prev,
        [selectedRole]: requirements
      }));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error guardando perfil');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const entries = Object.values(requirements);
    return {
      critical: entries.filter(v => v === 'C').length,
      important: entries.filter(v => v === 'I').length,
      desirable: entries.filter(v => v === 'D').length,
      na: entries.filter(v => v === 'N').length,
      total: entries.length
    };
  }, [requirements]);

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

  // Empty roles
  if (roles.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">No hay roles definidos</h3>
        <p className="text-gray-500">Los roles se extraen automáticamente de los colaboradores existentes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Perfil para:</label>
          <select
            value={selectedRole || ''}
            onChange={(e) => setSelectedRole(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[250px]"
          >
            <option value="">Seleccionar rol...</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          
          {/* Duplicate dropdown */}
          {selectedRole && roles.filter(r => r !== selectedRole && allProfiles[r]).length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
                <Copy size={14} />
                Copiar de...
              </button>
              <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-100 py-1 hidden group-hover:block z-10">
                {roles.filter(r => r !== selectedRole && allProfiles[r]).map(r => (
                  <button
                    key={r}
                    onClick={() => handleDuplicate(r)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNewRoleModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Perfil
          </button>
          <CriticidadLegend />
        </div>
      </div>

      {/* No role selected */}
      {!selectedRole && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Selecciona un rol</h3>
          <p className="text-gray-500 mt-1">Define qué skills son críticas, importantes o deseables para cada puesto.</p>
        </div>
      )}

      {/* Profile Editor */}
      {selectedRole && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Skills</p>
            </div>
            <div className="bg-critical/10 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-critical">{stats.critical}</p>
              <p className="text-xs text-gray-500">Críticas (C)</p>
            </div>
            <div className="bg-warning/10 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-warning">{stats.important}</p>
              <p className="text-xs text-gray-500">Importantes (I)</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-gray-600">{stats.desirable}</p>
              <p className="text-xs text-gray-500">Deseables (D)</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-light text-gray-400">{stats.na}</p>
              <p className="text-xs text-gray-500">N/A</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            {categories.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                skills={skills}
                requirements={requirements}
                onRequirementChange={handleRequirementChange}
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
                  Guardar Perfil
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* New Role Modal */}
      <NewRoleModal
        isOpen={showNewRoleModal}
        onClose={() => setShowNewRoleModal(false)}
        onCreateRole={handleCreateNewRole}
        existingRoles={roles}
      />
    </div>
  );
}
