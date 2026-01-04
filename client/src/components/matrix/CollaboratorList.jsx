import { useState, useMemo } from 'react';
import { Search, Filter, Star, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getTrendColor } from '../../lib/skillsLogic';

/**
 * CollaboratorList - The Talent Hub
 * 
 * Filterable list with metadata, sparklines and badges.
 * 
 * For Manager: "I need to find someone quickly"
 * For SaaS UX: "Filterable list with metadata pattern"
 */

// Filter options
const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos', filter: () => true },
  { id: 'critical', label: 'Con Brechas', icon: AlertTriangle, filter: (c) => c.brechas?.length > 0 },
  { id: 'experts', label: 'Expertos', icon: Star, filter: (c) => c.promedio >= 3.5 },
  { id: 'attention', label: 'Requieren Atención', icon: TrendingUp, filter: (c) => c.promedio < 2.5 },
];

// Sparkline mini chart
function Sparkline({ data, trend }) {
  if (!data || data.length < 2) {
    return <div className="w-[60px] h-[24px] bg-gray-50 rounded" />;
  }

  const chartData = data.map((value, i) => ({ value, index: i }));
  const color = getTrendColor(trend);

  return (
    <div className="w-[60px] h-[24px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
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
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${styles[type] || styles['critical']}`}>
      {children}
    </span>
  );
}

// Get badge for collaborator
function getCollaboratorBadge(collaborator) {
  if (collaborator.promedio >= 4.0) {
    return { type: 'top-performer', label: 'Top Performer', icon: Star };
  }
  if (collaborator.brechas?.length > 2) {
    return { type: 'critical', label: 'Brechas Críticas', icon: AlertTriangle };
  }
  if (collaborator.promedio < 2.5) {
    return { type: 'needs-attention', label: 'Needs Attention', icon: AlertTriangle };
  }
  return null;
}

// Collaborator Card
function CollaboratorCard({ collaborator, onSelect }) {
  const badge = getCollaboratorBadge(collaborator);
  // Use sparkline from props (real data), fallback to empty
  const sparkline = collaborator.sparkline || { points: [], trend: 'neutral' };
  
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
          <p className="text-sm text-gray-500 truncate">{collaborator.rol}</p>
        </div>

        {/* Right: Sparkline + Average */}
        <div className="flex items-center gap-3">
          <Sparkline data={sparkline.points} trend={sparkline.trend} />
          <div className="text-right">
            <p className={`text-2xl font-light tabular-nums ${
              collaborator.promedio >= 3.5 ? 'text-primary' : 
              collaborator.promedio >= 2.5 ? 'text-competent' : 'text-warning'
            }`}>
              {collaborator.promedio.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {sparkline.trend === 'up' ? '↑' : sparkline.trend === 'down' ? '↓' : '→'}
            </p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {categoryEntries.map(([key, valor]) => (
          <span 
            key={key}
            className={`text-xs px-2 py-1 rounded-full ${
              valor >= 3.5 ? 'bg-primary/5 text-primary' :
              valor >= 2.5 ? 'bg-competent/5 text-competent' :
              'bg-warning/5 text-warning'
            }`}
          >
            {key}: {valor.toFixed(1)}
          </span>
        ))}
        {Object.keys(collaborator.categorias || {}).length > 3 && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            +{Object.keys(collaborator.categorias).length - 3} más
          </span>
        )}
      </div>
    </button>
  );
}

// Main Component
export default function CollaboratorList({ collaborators = [], onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
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
