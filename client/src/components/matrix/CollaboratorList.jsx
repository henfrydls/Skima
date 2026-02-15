import { useState, useMemo } from 'react';
import { Search, Filter, Star, AlertTriangle, TrendingUp, ChevronRight, GitCompare } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { getTrendColor } from '../../lib/evolutionLogic';

/**
 * CollaboratorList - The Talent Hub
 * 
 * Filterable list with metadata, sparklines and badges.
 * 
 * For Manager: "I need to find someone quickly"
 * For SaaS UX: "Filterable list with metadata pattern"
 */

// Filter options with updated business rules
const FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'Todos',
    description: 'Mostrar todos los colaboradores',
    filter: () => true
  },
  {
    id: 'critical',
    label: 'Con Brechas',
    icon: AlertTriangle,
    description: 'Colaboradores con al menos una skill en nivel inferior al requerido por su rol',
    // Only evaluated collaborators with gaps
    filter: (c) => c.hasEvaluations && c.brechas?.length > 0
  },
  {
    id: 'experts',
    label: 'Expertos',
    icon: Star,
    description: 'Colaboradores con promedio general ≥ 4.0. Candidatos a mentorías',
    // Updated: >= 4.0, only evaluated collaborators
    filter: (c) => c.hasEvaluations && c.promedio >= 4.0
  },
  {
    id: 'attention',
    label: 'Requieren Atención',
    icon: TrendingUp,
    description: 'Promedio < 2.5 o skill crítica (C) con nivel bajo. Priorizar desarrollo',
    // Aligned with Evolution "Requieren Soporte" server logic
    filter: (c) => {
      if (!c.hasEvaluations) return false;
      // Condition 1: Low average
      if (c.promedio < 2.5) return true;
      // Condition 2: Any skill marked Critical (C) with nivel < 2.5
      const hasCriticalGap = Object.values(c.skills || {}).some(
        s => s.criticidad === 'C' && (s.nivel || 0) < 2.5
      );
      return hasCriticalGap;
    }
  },
  {
    id: 'unevaluated',
    label: 'Sin Evaluar',
    icon: AlertTriangle,
    description: 'Colaboradores que aún no tienen sesiones de evaluación registradas',
    // Collaborators without evaluations
    filter: (c) => !c.hasEvaluations
  },
];

// Custom tooltip for sparkline - positioned above using transform
const SparklineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const pointData = payload[0].payload;
    const label = pointData.label || 'Promedio';
    
    return (
      <div 
        className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg flex flex-col items-center min-w-[60px]"
        style={{ transform: 'translateY(-15px)' }}
      >
        <span className="text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">{label}</span>
        <span className="font-mono font-bold text-emerald-300">{payload[0].value.toFixed(1)}</span>
      </div>
    );
  }
  return null;
};

// Sparkline mini chart
function Sparkline({ data, trend }) {
  // TASK 1: Hide empty graphs - if no data or single point, render nothing
  if (!data || data.length < 2) {
    return null; // Clean empty space instead of placeholder box
  }

  // Add labels for tooltip context
  const chartData = data.map((value, i, arr) => ({ 
    value, 
    index: i,
    label: i === 0 ? 'Inicio' : i === arr.length - 1 ? 'Actual' : 'Histórico'
  }));
  
  const color = getTrendColor(trend);

  return (
    <div className="w-[60px] h-[24px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Tooltip 
            content={<SparklineTooltip />}
            cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
            position={{ y: -30 }}
            allowEscapeViewBox={{ x: false, y: true }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Badge component
function Badge({ type, children }) {
  const styles = {
    'top-performer': 'bg-primary/10 text-primary border-primary/20',
    'needs-attention': 'bg-warning/10 text-warning border-warning/20',
    'critical': 'bg-critical/10 text-critical border-critical/20',
    'unevaluated': 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${styles[type] || styles['critical']}`}>
      {children}
    </span>
  );
}

// Get badge for collaborator (updated business rules)
function getCollaboratorBadge(collaborator) {
  // Check if collaborator has no evaluations
  if (!collaborator.hasEvaluations) {
    return { type: 'unevaluated', label: 'Sin Evaluar', icon: AlertTriangle };
  }
  
  // Check for critical gaps first (highest priority)
  const hasCriticalGap = collaborator.brechas?.some(b => b.estado === 'BRECHA CRÍTICA');
  
  if (hasCriticalGap) {
    return { type: 'critical', label: 'Brechas Críticas', icon: AlertTriangle };
  }
  if (collaborator.promedio >= 4.0) {
    return { type: 'top-performer', label: 'Top Performer', icon: Star };
  }
  if (collaborator.promedio < 2.5) {
    return { type: 'needs-attention', label: 'Needs Attention', icon: AlertTriangle };
  }
  return null;
}

// Collaborator Card
function CollaboratorCard({ collaborator, onSelect, previousSnapshot = null }) {
  const badge = getCollaboratorBadge(collaborator);
  // Use sparkline from props (real data), fallback to empty
  const sparkline = collaborator.sparkline || { points: [], trend: 'neutral' };
  
  // TASK 2: Role Change Detection
  const hasRoleChanged = previousSnapshot && previousSnapshot.rol !== collaborator.rol;
  const previousRole = previousSnapshot?.rol;
  
  // TASK 2: Determine if we should show the trend arrow (only if sparkline has data)
  const showTrendArrow = sparkline.points && sparkline.points.length >= 2;
  
  // Category chips (collapsed)
  const categoryEntries = Object.entries(collaborator.categorias || {}).slice(0, 3);

  return (
    <button
      onClick={() => onSelect(collaborator)}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-5 
                 hover:border-primary hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Name, Role, Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {collaborator.nombre}
            </h3>
            {badge && (
              <Badge type={badge.type}>
                <badge.icon size={10} />
                {badge.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500 truncate">{collaborator.rol}</p>
            {/* Role Change Badge */}
            {hasRoleChanged && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100"
                title={`Cambió de puesto desde la última evaluación (${previousRole} → ${collaborator.rol})`}
              >
                <GitCompare size={10} />
                Cambio
              </span>
            )}
          </div>
        </div>

        {/* Right: Sparkline + Average */}
        <div className="flex items-center gap-3">
          <Sparkline data={sparkline.points} trend={sparkline.trend} />
          <div className="text-right">
            {collaborator.promedio !== null ? (
              <>
                <p className={`text-2xl font-light tabular-nums ${
                  collaborator.promedio >= 3.5 ? 'text-primary' : 
                  collaborator.promedio >= 2.5 ? 'text-competent' : 'text-warning'
                }`}>
                  {collaborator.promedio.toFixed(1)}
                </p>
                {/* TASK 1: Only show trend arrow if we have sparkline data */}
                {showTrendArrow && (
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {sparkline.trend === 'up' ? '↑' : sparkline.trend === 'down' ? '↓' : '→'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xl font-light text-gray-400">—</p>
            )}
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Category Chips - Smart Sorted & Responsive */}
      {(() => {
        // Smart sorting algorithm: Strengths first, zeros last
        const allEntries = Object.entries(collaborator.categorias || {});
        const sortedEntries = allEntries.sort((a, b) => {
          const [, valorA] = a;
          const [, valorB] = b;
          
          // Priority weights: 0 = lowest, higher = better priority
          const getPriority = (val) => {
            if (val === 0) return 0;           // Zeros go last
            if (val >= 4.0) return 3;          // Strengths (high priority)
            if (val >= 2.5) return 2;          // Competent (medium)
            return 1;                           // Gaps/Low (show but lower)
          };
          
          const priorityA = getPriority(valorA);
          const priorityB = getPriority(valorB);
          
          // Sort by priority desc, then by value desc
          if (priorityB !== priorityA) return priorityB - priorityA;
          return valorB - valorA;
        });
        
        // Responsive limits: 3 mobile, 5 desktop
        const mobileLimit = 3;
        const desktopLimit = 5;
        const remaining = sortedEntries.length - desktopLimit;
        
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {sortedEntries.slice(0, desktopLimit).map(([key, valor], index) => (
              <span 
                key={key}
                className={`text-xs px-2 py-1 rounded-full ${
                  valor >= 3.5 ? 'bg-primary/5 text-primary' :
                  valor >= 2.5 ? 'bg-competent/5 text-competent' :
                  valor > 0 ? 'bg-warning/5 text-warning' :
                  'bg-gray-100 text-gray-400'
                } ${index >= mobileLimit ? 'hidden lg:inline-flex' : ''}`}
              >
                {key}: {valor.toFixed(1)}
              </span>
            ))}
            {/* +N badge - only on desktop if more than 5 */}
            {remaining > 0 && (
              <span className="hidden lg:inline-flex text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                +{remaining} más
              </span>
            )}
            {/* Mobile remaining count (if more than 3) */}
            {sortedEntries.length > mobileLimit && (
              <span className="lg:hidden text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                +{sortedEntries.length - mobileLimit} más
              </span>
            )}
          </div>
        );
      })()}
    </button>
  );
}

// Main Component
export default function CollaboratorList({ collaborators = [], onSelect, initialFilter = 'all' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter || 'all');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'score' | 'score-desc'

  // Filter and search
  const filteredCollaborators = useMemo(() => {
    let result = [...collaborators];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.nombre.toLowerCase().includes(query) ||
        c.rol.toLowerCase().includes(query)
      );
    }

    // Apply filter
    const filterFn = FILTER_OPTIONS.find(f => f.id === activeFilter)?.filter;
    if (filterFn) {
      result = result.filter(filterFn);
    }

    // Apply sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortBy === 'score') {
      result.sort((a, b) => a.promedio - b.promedio);
    } else if (sortBy === 'score-desc') {
      result.sort((a, b) => b.promedio - a.promedio);
    }

    return result;
  }, [collaborators, searchQuery, activeFilter, sortBy]);

  // Get active filter description
  const activeFilterOption = FILTER_OPTIONS.find(f => f.id === activeFilter);
  const activeFilterDescription = activeFilterOption?.description;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-sm"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeFilter === option.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.icon && <option.icon size={14} />}
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="name">Por nombre</option>
              <option value="score-desc">Mayor promedio</option>
              <option value="score">Menor promedio</option>
            </select>
          </div>
        </div>

        {/* Filter Description - Contextual Hint */}
        {activeFilterDescription && (
          <div className="text-xs text-gray-500 transition-opacity duration-200">
            {activeFilterDescription}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          {filteredCollaborators.length} colaborador{filteredCollaborators.length !== 1 ? 'es' : ''}
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm text-primary hover:underline"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredCollaborators.map(collaborator => (
          <CollaboratorCard
            key={collaborator.id}
            collaborator={collaborator}
            onSelect={onSelect}
            previousSnapshot={collaborator.previousSnapshot}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredCollaborators.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No se encontraron colaboradores</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
