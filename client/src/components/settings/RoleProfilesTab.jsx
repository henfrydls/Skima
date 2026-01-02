import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBlocker, useSearchParams } from 'react-router-dom';
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
  X,
  AlertTriangle
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
 * - DIRTY STATE PROTECTION: Prevents accidental data loss
 */

const API_BASE = '/api';

// Criticality options with colors and descriptions
const CRITICIDAD_OPTIONS = [
  { value: 'C', label: 'Crítica', short: 'C', color: 'bg-critical text-white', desc: 'Indispensable para el puesto' },
  { value: 'I', label: 'Importante', short: 'I', color: 'bg-warning text-white', desc: 'Necesaria pero no bloqueante' },
  { value: 'D', label: 'Deseable', short: 'D', color: 'bg-gray-400 text-white', desc: 'Nice-to-have, suma puntos' },
  { value: 'N', label: 'N/A', short: '—', color: 'bg-gray-200 text-gray-500', desc: 'No aplica para este rol' },
];

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
            Tienes modificaciones pendientes en este perfil. Si sales ahora, perderás los cambios.
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
    </div>
  );
}

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
export default function RoleProfilesTab({ isActive = true }) {
  const { getHeaders } = useAuth();
  const [searchParams] = useSearchParams();
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Requirements state
  const [requirements, setRequirements] = useState({});
  const [initialRequirements, setInitialRequirements] = useState({}); // For dirty checking
  
  const [allProfiles, setAllProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  
  // Navigation blocking state
  const [pendingNavigation, setPendingNavigation] = useState(null); // { type: 'route' | 'role', target: ... }
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Pre-select role from URL param
  useEffect(() => {
    const rolFromUrl = searchParams.get('rol');
    if (rolFromUrl && roles.includes(rolFromUrl)) {
      setSelectedRole(rolFromUrl);
    }
  }, [searchParams, roles]);

  // Compare objects to check if dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(requirements) !== JSON.stringify(initialRequirements);
  }, [requirements, initialRequirements]);

  // React Router Blocker (blocks navigation if dirty)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle blocker state change
  useEffect(() => {
    if (blocker.state === "blocked") {
      setPendingNavigation({ type: 'route', target: null }); // Blocker handles the target internally
      setShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  // Handler to create new role
  const handleCreateNewRole = (roleName) => {
    // If dirty, warn first? Ideally yes, but simplified here assuming explicit create action
    if (isDirty) {
      if (!confirm('Tienes cambios sin guardar. ¿Deseas descartarlos y crear un nuevo rol?')) {
        return;
      }
    }
    setRoles(prev => [...prev, roleName]);
    setSelectedRole(roleName);
    // Initialize new role empty
    const defaults = {};
    skills.forEach(s => { defaults[s.id] = 'N'; });
    setRequirements(defaults);
    setInitialRequirements(defaults);
    setSaveSuccess(false);
  };

  // Fetch data on mount and when tab becomes active
  useEffect(() => {
    // Only refetch if tab is active
    if (!isActive) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/data`);
        if (!response.ok) throw new Error('Error fetching data');
        const data = await response.json();
        
        // Extract unique roles from collaborators + existing profiles
        const rolesFromCollaborators = data.collaborators?.map(c => c.rol) || [];
        const rolesFromProfiles = Object.keys(data.roleProfiles || {});
        const uniqueRoles = [...new Set([...rolesFromCollaborators, ...rolesFromProfiles])].filter(Boolean).sort();
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
  }, [isActive]); // Refetch when isActive changes to true

  // Safe Role Switcher
  const handleRoleSwitch = (newRole) => {
    if (!newRole) {
      setSelectedRole(null);
      return;
    }

    if (isDirty) {
      setPendingNavigation({ type: 'role', target: newRole });
      setShowUnsavedDialog(true);
    } else {
      setSelectedRole(newRole);
    }
  };

  // Load requirements when role changes
  useEffect(() => {
    if (!selectedRole) return;

    // First create defaults for all skills as 'N' (N/A)
    const defaults = {};
    skills.forEach(s => { defaults[s.id] = 'N'; });
    
    let loadedReqs;
    if (allProfiles[selectedRole]) {
      // Merge existing profile over defaults
      loadedReqs = { ...defaults, ...allProfiles[selectedRole] };
    } else {
      // New role - use all defaults
      loadedReqs = defaults;
    }
    
    setRequirements(loadedReqs);
    setInitialRequirements(loadedReqs); // Reset dirty state baseline
    setSaveSuccess(false);
    
  }, [selectedRole, allProfiles, skills]);

  // Handle requirement change
  const handleRequirementChange = (skillId, value) => {
    setRequirements(prev => ({
      ...prev,
      [skillId]: value
    }));
    setSaveSuccess(false);
  };

  // Duplicate profile
  const handleDuplicate = (sourceRole) => {
    if (allProfiles[sourceRole]) {
      const newReqs = { ...allProfiles[sourceRole] };
      setRequirements(newReqs);
      // NOTE: We do NOT update initialRequirements here, so it immediately becomes dirty
      // This is intentional: "Copy" is a change action.
    }
  };

  // Save profile
  const handleSave = async (shouldNavigateAfter = false) => {
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
      setInitialRequirements(requirements); // Reset dirty state
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Handle pending navigation if save was triggered from dialog
      if (shouldNavigateAfter) {
        setShowUnsavedDialog(false);
        if (pendingNavigation?.type === 'role') {
          setSelectedRole(pendingNavigation.target);
        } else if (pendingNavigation?.type === 'route' && blocker.state === "blocked") {
          blocker.proceed();
        }
        setPendingNavigation(null);
      }

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error guardando perfil');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Unsaved Dialog Actions
  const handleDiscardChanges = () => {
    setRequirements(initialRequirements); // Revert
    setShowUnsavedDialog(false);
    
    if (pendingNavigation?.type === 'role') {
      setSelectedRole(pendingNavigation.target);
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
            onChange={(e) => handleRoleSwitch(e.target.value)}
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
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-20 w-72">
                <div className="bg-white shadow-xl rounded-lg border border-gray-100 py-1 overflow-hidden">
                  {roles.filter(r => r !== selectedRole && allProfiles[r]).map(r => {
                    const definedCount = Object.values(allProfiles[r]).filter(v => v !== 'N').length;
                    return (
                      <button
                        key={r}
                        onClick={() => handleDuplicate(r)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group/item transition-colors border-b last:border-0 border-gray-50"
                      >
                        <div>
                          <span className="block text-sm font-medium text-gray-700 mb-0.5">{r}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle size={10} /> {definedCount} skills definidas
                          </span>
                        </div>
                        <Copy size={14} className="text-primary opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-1 group-hover/item:translate-x-0" />
                      </button>
                    );
                  })}
                </div>
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
               onClick={() => setRequirements(initialRequirements)}
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
                  Guardar Cambios
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
