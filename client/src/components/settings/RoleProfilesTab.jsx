import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  AlertTriangle,
  Search,
  ArrowLeft,
  LayoutGrid,
  List,
  MoreVertical,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

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

  return createPortal(
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
    </div>,
    document.body
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

  return createPortal(
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
    </div>,
    document.body
  );
}

// Edit Role Modal Component (Rename)
function EditRoleModal({ isOpen, onClose, onRename, currentName, existingRoles, getHeaders }) {
  const [newName, setNewName] = useState(currentName || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName || '');
      setError('');
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }
    if (newName.trim() !== currentName && existingRoles.includes(newName.trim())) {
      setError('Ya existe un perfil con ese nombre');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/role-profiles/${encodeURIComponent(currentName)}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ newName: newName.trim() })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al renombrar');
      }
      
      onRename(currentName, newName.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Renombrar Perfil</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Rol
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ej: Senior Developer, UX Lead..."
              autoFocus
            />
            {error && <p className="text-xs text-critical mt-1">{error}</p>}
          </div>
          <p className="text-xs text-gray-500">
            Los colaboradores con este rol serán actualizados automáticamente.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
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
export default function RoleProfilesTab({ isActive = true, onDirtyChange, onDataChange }) {
  const { getHeaders } = useAuth();
  const [searchParams] = useSearchParams();
  const [roles, setRoles] = useState([]);
  
  // Toolbar State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Persist view preference in localStorage
    return localStorage.getItem('roleProfilesViewMode') || 'grid';
  });
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Requirements state
  const [requirements, setRequirements] = useState({});
  const [initialRequirements, setInitialRequirements] = useState({}); // For dirty checking
  
  const [allProfiles, setAllProfiles] = useState({});
  const [collaborators, setCollaborators] = useState([]); // For counting collaborators per role
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  
  // Edit/Rename Modal state
  const [editRoleModal, setEditRoleModal] = useState({ isOpen: false, roleName: null });
  const [activeActionMenu, setActiveActionMenu] = useState(null); // role name of currently open menu
  
  // Navigation blocking state
  const [pendingNavigation, setPendingNavigation] = useState(null); // { type: 'route' | 'role', target: ... }
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Computed & Filters
  const filteredRoles = useMemo(() => {
    return roles
      .filter(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort();
  }, [roles, searchTerm]);

  const getRoleStatus = useCallback((roleName) => {
    const profile = allProfiles?.[roleName]; 
    if (!profile) return { count: 0, color: 'bg-gray-200', text: 'Sin definir' };
    const count = Object.values(profile).filter(v => v !== 'N').length;
    return { 
      count, 
      color: count > 0 ? (count >= 10 ? 'bg-competent' : 'bg-warning') : 'bg-gray-200',
      text: count > 0 ? `${count} skills` : 'Sin definir'
    };
  }, [allProfiles]);

  // Get collaborator count for a role
  const getCollaboratorCount = useCallback((roleName) => {
    return collaborators.filter(c => c.rol === roleName).length;
  }, [collaborators]);

  // Handle rename of role profile
  const handleRename = useCallback((oldName, newName) => {
    // Update roles list
    setRoles(prev => prev.map(r => r === oldName ? newName : r).sort());
    
    // Update profiles
    setAllProfiles(prev => {
      const { [oldName]: profile, ...rest } = prev;
      return { ...rest, [newName]: profile };
    });
    
    // Update collaborators locally
    setCollaborators(prev => prev.map(c => 
      c.rol === oldName ? { ...c, rol: newName } : c
    ));
    
    // If this role is selected, update selection
    if (selectedRole === oldName) {
      setSelectedRole(newName);
    }
    
    // Notify parent to trigger refetch in other tabs (Collaborators, Evaluations)
    if (onDataChange) {
      onDataChange();
    }
  }, [selectedRole, onDataChange]);

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

  // Persist viewMode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('roleProfilesViewMode', viewMode);
  }, [viewMode]);

  // Notify parent of dirty state for tab switch protection
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

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
        // Only show spinner on first load to make tab switching instant
        if (roles.length === 0) setIsLoading(true);
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
        
        // Save collaborators for counting per role
        setCollaborators(data.collaborators || []);
      } catch (err) {
        setError('Error cargando datos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isActive]); // Refetch when isActive changes to true

  // Safe Role Switcher - wrapped in useCallback to ensure fresh isDirty value
  const handleRoleSwitch = useCallback((newRole) => {
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
  }, [isDirty]);

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
      
      setInitialRequirements(requirements); // Reset dirty state
      
      toast.success('Perfil guardado correctamente');

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
      toast.error('Error guardando perfil');
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
    <div className="space-y-6 relative z-0">
      {/* 1. EXTERNAL TOOLBAR (Controls) - Only visible when NO role is selected (Overview) */}
      {!selectedRole && (
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Buscar rol..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
           </div>

           {/* Actions: View Toggle + New Button */}
           <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                 <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Vista de Cuadrícula"
                 >
                    <LayoutGrid size={18} />
                 </button>
                 <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Vista de Lista"
                 >
                    <List size={18} />
                 </button>
              </div>

              <div className="h-8 w-px bg-gray-300 mx-1 hidden md:block"></div>

              <button
                 onClick={() => setShowNewRoleModal(true)}
                 className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                 <Plus size={18} />
                 Nuevo Perfil
              </button>
           </div>
        </div>
      )}

      {/* 2. MAIN CONTENT CARD */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative z-0 ${selectedRole ? 'min-h-[600px]' : ''}`}>
        
        {/* VIEW 1: ROLE LIST / GRID */}
        {!selectedRole && (
           <div className="p-6">
              {filteredRoles.length === 0 ? (
                 <div className="py-20 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No se encontraron roles</h3>
                    <p className="text-gray-500">Prueba con otro término de búsqueda o crea un nuevo perfil.</p>
                 </div>
              ) : viewMode === 'grid' ? (
                 /* GRID VIEW - Redesigned with action menu */
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRoles.map(role => {
                       const status = getRoleStatus(role);
                       const collabCount = getCollaboratorCount(role);
                       return (
                          <div
                             key={role}
                             className="bg-white p-5 rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all text-left group relative"
                          >
                             {/* Header with icon and action menu */}
                             <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                   <Briefcase size={20} />
                                </div>
                                
                                {/* Action Menu */}
                                <div className="relative">
                                   <button 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setActiveActionMenu(activeActionMenu === role ? null : role);
                                      }}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                                   >
                                      <MoreVertical size={18} />
                                   </button>
                                   
                                   {activeActionMenu === role && (
                                      <>
                                         <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenu(null)} />
                                         <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                            <button
                                               onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveActionMenu(null);
                                                  handleRoleSwitch(role);
                                               }}
                                               className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                               <Edit3 size={14} />
                                               Editar skills
                                            </button>
                                            <button
                                               onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveActionMenu(null);
                                                  setEditRoleModal({ isOpen: true, roleName: role });
                                               }}
                                               className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                               <Briefcase size={14} />
                                               Renombrar
                                            </button>
                                         </div>
                                      </>
                                   )}
                                </div>
                             </div>
                             
                             {/* Role Name - Clickable */}
                             <button 
                                onClick={() => handleRoleSwitch(role)}
                                className="block w-full text-left"
                             >
                                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-primary transition-colors truncate">{role}</h3>
                             </button>
                             
                             {/* Status Row */}
                             <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                   <span className="text-xs text-gray-500">{status.text}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                   <Users size={12} />
                                   <span>{collabCount}</span>
                                </div>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              ) : (
                 /* LIST VIEW - Redesigned with action menu and collaborator count */
                 <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full">
                       <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
                          <tr>
                             <th className="px-6 py-3 text-left">Rol</th>
                             <th className="px-6 py-3 text-left">Skills</th>
                             <th className="px-6 py-3 text-left">Colaboradores</th>
                             <th className="px-6 py-3 text-right w-16">Acciones</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {filteredRoles.map(role => {
                             const status = getRoleStatus(role);
                             const collabCount = getCollaboratorCount(role);
                             return (
                                <tr key={role} className="group hover:bg-gray-50 transition-colors">
                                   <td className="px-6 py-4">
                                      <button 
                                         onClick={() => handleRoleSwitch(role)}
                                         className="flex items-center gap-3 text-left"
                                      >
                                         <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Briefcase size={16} />
                                         </div>
                                         <span className="font-medium text-gray-700 group-hover:text-primary transition-colors">{role}</span>
                                      </button>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                         <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                         <span className="text-sm text-gray-600">{status.text}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                         <Users size={14} />
                                         <span>{collabCount} {collabCount === 1 ? 'persona' : 'personas'}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <div className="relative inline-block">
                                         <button
                                            onClick={(e) => {
                                               e.stopPropagation();
                                               setActiveActionMenu(activeActionMenu === role ? null : role);
                                            }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                         >
                                            <MoreVertical size={18} />
                                         </button>
                                         
                                         {activeActionMenu === role && (
                                            <>
                                               <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenu(null)} />
                                               <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                                  <button
                                                     onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveActionMenu(null);
                                                        handleRoleSwitch(role);
                                                     }}
                                                     className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                  >
                                                     <Edit3 size={14} />
                                                     Editar skills
                                                  </button>
                                                  <button
                                                     onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveActionMenu(null);
                                                        setEditRoleModal({ isOpen: true, roleName: role });
                                                     }}
                                                     className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                  >
                                                     <Briefcase size={14} />
                                                     Renombrar
                                                  </button>
                                               </div>
                                            </>
                                         )}
                                      </div>
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>
        )}

      {/* VIEW 2: EDITOR (DETAIL) */}
      {selectedRole && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            {/* Context Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleRoleSwitch(null)}
                  className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Volver a la lista"
                >
                   <ArrowLeft size={20} />
                </button>
                <div>
                   <div className="flex items-center gap-2">
                     <h2 className="text-xl font-bold text-gray-800">{selectedRole}</h2>
                     <span className={`w-2.5 h-2.5 rounded-full ${getRoleStatus(selectedRole).color}`} />
                   </div>
                   <p className="text-xs text-gray-500">Editando perfil de competencias</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Save Status Indicator */}
                {saveSuccess && (
                  <span className="text-sm text-competent flex items-center gap-1 bg-competent/10 px-3 py-1 rounded-full animate-fade-in">
                    <CheckCircle size={14} /> Guardado
                  </span>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100" title="Copiar de otro rol">
                       <Copy size={18} />
                    </button>
                    {/* Copy Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-xl rounded-lg border border-gray-100 py-1 hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
                       <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                          Copiar configuración de...
                       </div>
                       <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {roles.filter(r => r !== selectedRole && allProfiles[r]).map(r => (
                          <button
                            key={r}
                            onClick={() => handleDuplicate(r)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 truncate"
                          >
                            {r}
                          </button>
                        ))}
                        </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving || !isDirty}
                    className={`
                      flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm
                      ${isDirty 
                        ? 'bg-primary text-white hover:bg-primary/90 hover:shadow shadow-primary/20 hover:-translate-y-0.5' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}
                    `}
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-6 relative">
              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                 <div className="bg-critical/5 border border-critical/10 p-4 rounded-xl text-center">
                    <div className="text-2xl font-light text-critical">{stats.critical}</div>
                    <div className="text-[10px] font-bold text-critical tracking-wider uppercase opacity-70">Críticas</div>
                 </div>
                 <div className="bg-warning/5 border border-warning/10 p-4 rounded-xl text-center">
                    <div className="text-2xl font-light text-warning">{stats.important}</div>
                    <div className="text-[10px] font-bold text-warning tracking-wider uppercase opacity-70">Importantes</div>
                 </div>
                 <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
                    <div className="text-2xl font-light text-gray-600">{stats.desirable}</div>
                    <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase opacity-70">Deseables</div>
                 </div>
                 <div className="bg-white border border-gray-200 p-4 rounded-xl text-center shadow-sm">
                    <div className="text-2xl font-light text-gray-400">{stats.na}</div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase opacity-70">N/A</div>
                 </div>
              </div>

              {/* Categories */}
              <div className="space-y-6 pb-20 max-w-5xl mx-auto">
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
            </div>
        </div>
      )}

      </div>

      {/* Modals & Dialogs */}
      <NewRoleModal
        isOpen={showNewRoleModal}
        onClose={() => setShowNewRoleModal(false)}
        onCreateRole={handleCreateNewRole}
        existingRoles={roles}
      />

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
        onSave={() => handleSave(true)}
      />

      <EditRoleModal
        isOpen={editRoleModal.isOpen}
        onClose={() => setEditRoleModal({ isOpen: false, roleName: null })}
        onRename={handleRename}
        currentName={editRoleModal.roleName}
        existingRoles={roles}
        getHeaders={getHeaders}
      />

      {/* Sticky Footer for Save Actions - Only visible when dirty (matches EvaluationsTab style) */}
      {selectedRole && (
        <div 
          className={`
            sticky bottom-2 z-20 flex justify-end gap-3 p-4 mx-2 rounded-xl shadow-lg border border-gray-100 bg-white/90 backdrop-blur-sm transition-all duration-300
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
      )}

    </div>
  );
}

