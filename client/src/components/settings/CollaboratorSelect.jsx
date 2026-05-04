import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, ChevronDown, Search } from 'lucide-react';

/**
 * CollaboratorSelect - Custom dropdown for selecting a collaborator
 * Props:
 * - collaborators: array of { id, nombre, rol, isActive }
 * - value: selected collaborator id (or null)
 * - onChange: (id) => void
 * - disabled: boolean (optional) - renders static text when true
 *
 * The options panel is rendered into a React portal with fixed positioning so
 * it escapes parent containers that have `overflow-hidden` (e.g. modal dialogs).
 */
export default function CollaboratorSelect({ collaborators, value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = collaborators.find(c => c.id === value);

  // Position panel relative to the trigger; flips above when there's no room below.
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = Math.min(Math.max(spaceBelow, spaceAbove) - 20, 360);
    const openUp = spaceAbove > spaceBelow;

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

  // Position on open + reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [isOpen]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const filtered = collaborators.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.rol.toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(c => c.isActive !== false).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const inactive = filtered.filter(c => c.isActive === false).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  // Disabled: render static display
  if (disabled) {
    return (
      <div className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm cursor-not-allowed opacity-70">
        <User size={16} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1 truncate text-gray-800">
          {selected ? `${selected.nombre} (${selected.rol})` : 'Select collaborator...'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
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
        <User size={16} className="text-gray-400 flex-shrink-0" />
        <span className={`flex-1 truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? `${selected.nombre} (${selected.rol})` : 'Select collaborator...'}
        </span>
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel — rendered via portal so it escapes modal overflow:hidden */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          role="listbox"
          aria-label="Select collaborator"
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
                placeholder="Search..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No results</div>
            ) : (
              <>
                {/* Placeholder option */}
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => handleSelect(null)}
                  className={`
                    w-full text-left px-3 py-2 text-sm transition-colors
                    ${!value ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}
                  `}
                >
                  Select collaborator...
                </button>

                {/* Active group */}
                {active.length > 0 && (
                  <>
                    {inactive.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wider">
                        Active
                      </div>
                    )}
                    {active.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        aria-selected={c.id === value}
                        onClick={() => handleSelect(c.id)}
                        className={`
                          w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors
                          ${c.id === value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}
                        `}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-competent flex-shrink-0" />
                        <span className="truncate">{c.nombre}</span>
                        <span className="text-gray-400 text-xs ml-auto flex-shrink-0">
                          {c.rol}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {/* Inactive group */}
                {inactive.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wider border-t border-gray-100">
                      Deactivated
                    </div>
                    {inactive.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        aria-selected={c.id === value}
                        onClick={() => handleSelect(c.id)}
                        className={`
                          w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors
                          ${c.id === value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-500 hover:bg-gray-50'}
                        `}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="truncate opacity-60">{c.nombre}</span>
                        <span className="text-gray-400 text-xs ml-auto flex-shrink-0">
                          {c.rol}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
