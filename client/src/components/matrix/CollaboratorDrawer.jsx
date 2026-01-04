import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  TrendingUp,
  GraduationCap,
  Users,
  Briefcase,
  Calendar,
  AlertTriangle,
  Star
} from 'lucide-react';
import { previousSnapshots, calculateDelta, suggestedActions } from '../../data/mockHistory';

/**
 * CollaboratorDrawer - Slide-over panel from right
 * 
 * The 360 Profile view with historical comparison.
 * Uses framer-motion for smooth animation.
 * 
 * For HR: "I want to see history, not just today's snapshot"
 * For SaaS UX: "Don't reload full page, keep context"
 */

// Lollipop Chart with Ghost Points
function LollipopChart({ categorias, previousCategorias = null }) {
  const entries = Object.entries(categorias);
  const maxValue = 5;

  return (
    <div className="space-y-4">
      {entries.map(([key, valor]) => {
        const prevValor = previousCategorias?.[key];
        const delta = prevValor ? calculateDelta(valor, prevValor) : null;
        const percentage = (valor / maxValue) * 100;
        const prevPercentage = prevValor ? (prevValor / maxValue) * 100 : 0;

        return (
          <div key={key} className="flex items-center gap-4">
            <span className="w-20 text-sm font-medium text-gray-600 truncate" title={key}>
              {key}
            </span>
            <div className="flex-1 relative h-6">
              {/* Track */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-100 rounded-full" />
              
              {/* Previous value (Ghost Point) */}
              {prevValor && (
                <>
                  {/* Connection line */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-gray-300 transition-all"
                    style={{ 
                      left: `${Math.min(prevPercentage, percentage)}%`,
                      width: `${Math.abs(percentage - prevPercentage)}%`
                    }}
                  />
                  {/* Ghost circle */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-300 border-2 border-white shadow-sm transition-all"
                    style={{ left: `calc(${prevPercentage}% - 6px)` }}
                    title={`Anterior: ${prevValor.toFixed(1)}`}
                  />
                </>
              )}
              
              {/* Current value bar */}
              <div 
                className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-full transition-all ${
                  valor >= 3.5 ? 'bg-primary' : valor >= 2.5 ? 'bg-competent' : 'bg-warning'
                }`}
                style={{ width: `${percentage}%` }}
              />
              
              {/* Current value circle (lollipop head) */}
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all ${
                  valor >= 3.5 ? 'bg-primary' : valor >= 2.5 ? 'bg-competent' : 'bg-warning'
                }`}
                style={{ left: `calc(${percentage}% - 8px)` }}
              />
            </div>
            <div className="w-16 text-right flex items-center justify-end gap-1">
              <span className={`text-sm font-semibold tabular-nums ${
                valor >= 3.5 ? 'text-primary' : valor >= 2.5 ? 'text-competent' : 'text-warning'
              }`}>
                {valor.toFixed(1)}
              </span>
              {delta && (
                <span className={`text-xs tabular-nums ${
                  delta.direction === 'up' ? 'text-success' : 
                  delta.direction === 'down' ? 'text-critical' : 'text-gray-400'
                }`}>
                  {delta.formatted}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Action Card
function ActionCard({ action, priority }) {
  const icons = {
    'GraduationCap': GraduationCap,
    'Users': Users,
    'Briefcase': Briefcase,
    'Calendar': Calendar,
    'Target': TrendingUp,
    'BookOpen': GraduationCap,
  };
  const Icon = icons[action.icon] || TrendingUp;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      priority === 'high' ? 'bg-critical/5 border border-critical/10' :
      priority === 'medium' ? 'bg-warning/5 border border-warning/10' :
      'bg-gray-50 border border-gray-100'
    }`}>
      <Icon size={16} className={
        priority === 'high' ? 'text-critical' :
        priority === 'medium' ? 'text-warning' : 'text-gray-500'
      } />
      <span className="text-sm text-gray-700">{action.action}</span>
    </div>
  );
}

// Main Drawer Component
export default function CollaboratorDrawer({ 
  isOpen, 
  onClose, 
  collaborator,
  categories = []
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Get previous snapshot for comparison
  const previousSnapshot = useMemo(() => {
    if (!collaborator) return null;
    return previousSnapshots[collaborator.id] || null;
  }, [collaborator]);

  // Calculate delta
  const promedioDelta = useMemo(() => {
    if (!collaborator || !previousSnapshot) return null;
    return calculateDelta(collaborator.promedio, previousSnapshot.promedio);
  }, [collaborator, previousSnapshot]);

  // Identify gaps (skills where nivel < expected)
  const gaps = useMemo(() => {
    if (!collaborator?.brechas) return [];
    return collaborator.brechas.slice(0, 5);
  }, [collaborator]);

  // Identify strengths
  const strengths = useMemo(() => {
    if (!collaborator?.fortalezas) return [];
    return collaborator.fortalezas.slice(0, 5);
  }, [collaborator]);

  // Get initials
  const initials = collaborator?.nombre
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2) || '??';

  if (!collaborator) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">{collaborator.nombre}</h2>
                    <p className="text-sm text-gray-500">{collaborator.rol}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Comparison selector */}
              {previousSnapshot && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>Comparando con: </span>
                  <span className="font-medium text-gray-700">
                    {new Date(previousSnapshot.evaluatedAt).toLocaleDateString('es', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-3xl font-light tabular-nums ${
                      collaborator.promedio >= 3.5 ? 'text-primary' : 
                      collaborator.promedio >= 2.5 ? 'text-competent' : 'text-warning'
                    }`}>
                      {collaborator.promedio.toFixed(1)}
                    </span>
                    {promedioDelta && (
                      <span className={`flex items-center text-sm ${
                        promedioDelta.direction === 'up' ? 'text-success' : 
                        promedioDelta.direction === 'down' ? 'text-critical' : 'text-gray-400'
                      }`}>
                        {promedioDelta.direction === 'up' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {promedioDelta.formatted}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Promedio</p>
                </div>
                <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/10">
                  <p className="text-2xl font-light text-warning tabular-nums">{gaps.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Brechas</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-2xl font-light text-primary tabular-nums">{strengths.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Fortalezas</p>
                </div>
              </div>
            </div>

            {/* Lollipop Chart */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Nivel por Categoría
              </h3>
              <LollipopChart 
                categorias={collaborator.categorias} 
                previousCategorias={previousSnapshot?.categorias}
              />
              {previousSnapshot && (
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span>Valor anterior</span>
                </div>
              )}
            </div>

            {/* Gaps Section */}
            {gaps.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-warning" />
                  Áreas de Mejora
                </h3>
                <div className="space-y-2 mb-4">
                  {gaps.map((gap, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      <span className="text-gray-700">{gap}</span>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Acciones Sugeridas
                </h4>
                <div className="space-y-2">
                  {suggestedActions['AREA_MEJORA'].map((action, i) => (
                    <ActionCard key={i} action={action} priority={action.priority} />
                  ))}
                </div>
              </div>
            )}

            {/* Strengths Section */}
            {strengths.length > 0 && (
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Star size={14} className="text-primary" />
                  Fortalezas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {strengths.map((strength, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
