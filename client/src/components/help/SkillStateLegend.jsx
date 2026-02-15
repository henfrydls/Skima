import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SkillStateLegend Component
 *
 * Displays the 4 skill evaluation states with their visual indicators and criteria.
 * Used in Team Matrix to help users understand the color coding.
 *
 * Props:
 * - compact: boolean - When true, only shows dots + labels (no criteria text)
 * - className: string - Additional CSS classes
 */
export default function SkillStateLegend({ compact = false, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const states = [
    {
      id: 'critical',
      label: 'Brecha Crítica',
      dotClasses: 'w-4 h-4 rounded-full bg-gray-300 ring-2 ring-rose-500 ring-offset-1',
      criteria: 'Skill crítica (C) + uso frecuente (D/S) + nivel < 3'
    },
    {
      id: 'improvement',
      label: 'Área de Mejora',
      dotClasses: 'w-4 h-4 rounded-full bg-gray-300 ring-2 ring-amber-400 ring-offset-1',
      criteria: 'Skill crítica con nivel < 3.5 o importante con nivel < 3'
    },
    {
      id: 'competent',
      label: 'Competente',
      dotClasses: 'w-4 h-4 rounded-full bg-competent',
      criteria: 'Cumple requisitos mínimos del rol (nivel 3-4)'
    },
    {
      id: 'strength',
      label: 'Fortaleza',
      dotClasses: 'w-4 h-4 rounded-full bg-primary',
      criteria: 'Nivel >= 4, dominio avanzado'
    }
  ];

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Estados de Evaluación
        </h4>
        {!compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <span>{isExpanded ? 'Ocultar reglas' : 'Ver reglas'}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Horizontal legend items */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {states.map(state => (
          <div key={state.id} className="flex items-center gap-2">
            <div className={state.dotClasses} />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700">
                {state.label}
              </span>
              {!compact && (
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[10px] text-gray-500 mt-0.5 max-w-[200px]"
                    >
                      {state.criteria}
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
