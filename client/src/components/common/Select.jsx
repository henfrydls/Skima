import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Select - Reusable custom dropdown matching CollaboratorSelect / SkillSelect styling.
 * Renders the options panel via a portal with fixed positioning so it escapes
 * parent containers with overflow:hidden (e.g. modal dialogs).
 *
 * Props:
 * - options: Array<{ value: string|number, label: string }>
 * - value: current value
 * - onChange: (value) => void
 * - placeholder: string shown when no value selected
 * - id, name: passed through for form association / labels
 * - className: extra classes for the trigger button
 */
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  id,
  name,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selected = options.find(o => o.value === value);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = Math.min(Math.max(spaceBelow, spaceAbove) - 20, 320);
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

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        id={id}
        name={name}
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
          ${className}
        `}
      >
        <span className={`flex-1 truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={dropdownStyle}
          role="listbox"
          className="bg-white rounded-lg border border-gray-200 shadow-lg z-[9999] overflow-y-auto"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
              className={`
                w-full text-left px-3 py-2 text-sm transition-colors
                ${opt.value === value
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
