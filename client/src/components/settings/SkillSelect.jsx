import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Search, Target } from 'lucide-react';
import { API_BASE } from '../../lib/apiBase';

/**
 * SkillSelect - Custom dropdown for selecting a skill
 * Shows role profile skills first (with gap info), then other skills by category.
 * Renders via portal for correct z-index/overflow handling.
 *
 * Props:
 * - skills: array of { id, nombre, categoriaId, ... }
 * - categories: array of { id, nombre, ... }
 * - collaboratorId: for fetching role profile gaps
 * - value: selected skillId (or null)
 * - onChange(skillId): callback
 * - disabled: boolean
 */
export default function SkillSelect({ skills, categories, collaboratorId, value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [gapSuggestions, setGapSuggestions] = useState([]);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = skills.find(s => s.id === value);

  // Fetch gap suggestions for this collaborator
  useEffect(() => {
    if (!collaboratorId) return;
    fetch(`${API_BASE}/api/collaborators/${collaboratorId}/suggested-goals`)
      .then(res => res.ok ? res.json() : [])
      .then(setGapSuggestions)
      .catch(() => setGapSuggestions([]));
  }, [collaboratorId]);

  // Build a map of skillId -> gap info
  const gapMap = useMemo(() => {
    const map = {};
    gapSuggestions.forEach(g => {
      map[g.skillId] = g;
    });
    return map;
  }, [gapSuggestions]);

  // Role skill IDs set
  const roleSkillIds = useMemo(() => new Set(Object.keys(gapMap).map(Number)), [gapMap]);

  // Category map
  const catMap = useMemo(() => {
    const m = {};
    categories.forEach(c => { m[c.id] = c.nombre; });
    return m;
  }, [categories]);

  // Split & sort skills
  const { roleSkills, otherSkillsByCategory } = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = skills.filter(s => s.nombre.toLowerCase().includes(lowerSearch));

    const role = filtered
      .filter(s => roleSkillIds.has(s.id))
      .sort((a, b) => {
        const gapA = gapMap[a.id]?.gapSize || 0;
        const gapB = gapMap[b.id]?.gapSize || 0;
        return gapB - gapA; // biggest gap first
      });

    const others = filtered.filter(s => !roleSkillIds.has(s.id));
    const grouped = {};
    others.forEach(s => {
      const catName = catMap[s.categoriaId || s.categoria] || 'Other';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(s);
    });
    // Sort skills within each category
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.nombre.localeCompare(b.nombre)));

    return { roleSkills: role, otherSkillsByCategory: grouped };
  }, [skills, roleSkillIds, gapMap, catMap, search]);

  const otherCount = Object.values(otherSkillsByCategory).reduce((sum, arr) => sum + arr.length, 0);
  const hasRoleSkills = roleSkills.length > 0;

  // Calculate dropdown position. Prefer opening downward; only flip up when
  // the panel doesn't fit below AND there's more room above.
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const PREFERRED_HEIGHT = 350;
    const MARGIN = 20;
    const fitsBelow = spaceBelow >= 200;
    const openUp = !fitsBelow && spaceAbove > spaceBelow;
    const maxH = Math.min(openUp ? spaceAbove - MARGIN : spaceBelow - MARGIN, PREFERRED_HEIGHT);

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight: maxH,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }
      ),
    });
  };

  // Position on open & scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearch('');
        setOthersExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
        setOthersExpanded(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleSelect = (skillId) => {
    onChange(skillId);
    setIsOpen(false);
    setSearch('');
    setOthersExpanded(false);
  };

  // Find gap info for selected skill
  const selectedGap = value ? gapMap[value] : null;

  // Disabled state
  if (disabled) {
    return (
      <div className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm cursor-not-allowed opacity-70">
        <Target size={16} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1 truncate text-gray-800">
          {selected ? selected.nombre : 'None (optional)'}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-lg border bg-white text-sm text-left
          transition-all duration-150
          ${isOpen
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-gray-200 hover:border-gray-300'
          }
        `}
      >
        <Target size={14} className="text-gray-400 flex-shrink-0" />
        <span className={`flex-1 truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected.nombre : 'None (optional)'}
        </span>
        {selectedGap && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {selectedGap.currentLevel.toFixed(1)} → {selectedGap.targetLevel.toFixed(1)}
          </span>
        )}
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal dropdown */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          role="listbox"
          aria-label="Select skill"
          className="bg-white rounded-lg border border-gray-200 shadow-lg z-[9999] overflow-hidden flex flex-col"
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1">
            {/* None option */}
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => handleSelect(null)}
              className={`
                w-full text-left px-3 py-2 text-sm transition-colors
                ${!value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-400 hover:bg-gray-50'}
              `}
            >
              None (optional)
            </button>

            {/* Role profile skills section */}
            {hasRoleSkills && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wider">
                  Skills for this role
                </div>
                {roleSkills.map(s => {
                  const gap = gapMap[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={s.id === value}
                      onClick={() => handleSelect(s.id)}
                      className={`
                        w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors
                        ${s.id === value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="truncate">{s.nombre}</span>
                      {gap && (
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          Lvl {gap.currentLevel.toFixed(1)} → {gap.targetLevel.toFixed(1)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {/* Other skills section */}
            {otherCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setOthersExpanded(!othersExpanded)}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wider flex items-center gap-1 hover:bg-gray-100 transition-colors border-t border-gray-100"
                >
                  {othersExpanded
                    ? <ChevronDown size={12} className="flex-shrink-0" />
                    : <ChevronRight size={12} className="flex-shrink-0" />
                  }
                  Other skills ({otherCount})
                </button>

                {othersExpanded && (
                  <>
                    {Object.entries(otherSkillsByCategory)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([catName, catSkills]) => (
                        <div key={catName}>
                          <div className="px-4 py-1 text-xs text-gray-400 font-medium">
                            {catName}
                          </div>
                          {catSkills.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              role="option"
                              aria-selected={s.id === value}
                              onClick={() => handleSelect(s.id)}
                              className={`
                                w-full text-left pl-6 pr-3 py-2 text-sm flex items-center gap-2 transition-colors
                                ${s.id === value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}
                              `}
                            >
                              <span className="truncate">{s.nombre}</span>
                            </button>
                          ))}
                        </div>
                      ))
                    }
                  </>
                )}
              </>
            )}

            {/* Fallback: no role skills, show all by category (when no gap suggestions) */}
            {!hasRoleSkills && otherCount === 0 && skills.length > 0 && !search && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No skills available</div>
            )}

            {/* No search results */}
            {search && roleSkills.length === 0 && otherCount === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No results</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
