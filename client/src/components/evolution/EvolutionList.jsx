import { useMemo, useState } from 'react';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  UserX, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getCollaboratorsEvolution } from '../../lib/evolutionLogic';

/**
 * EvolutionList - Collaborator Evolution Table
 * 
 * Shows all collaborators with:
 * - Avatar, Name, Role
 * - Role change badge
 * - Active/Inactive status
 * - Mini sparkline (handles one-shot as single dot)
 * - Delta with color coding
 */

// Mini Sparkline Component
function MiniSparkline({ data, isAtRisk, isOneShot, hasGaps }) {
  const validPoints = data.filter(d => d.promedio !== null);
  
  // One-shot: Show single dot
  if (isOneShot) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isAtRisk ? 'bg-rose-500' : 'bg-indigo-500'}`} />
        <span className="text-xs text-slate-400 italic">New</span>
      </div>
    );
  }
  
  // No data
  if (validPoints.length === 0) {
    return <span className="text-xs text-slate-400 italic">—</span>;
  }
  
  const strokeColor = isAtRisk ? '#f43f5e' : hasGaps ? '#94a3b8' : '#6366f1';
  const strokeStyle = hasGaps ? '3 3' : undefined;
  
  return (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Line
            type="monotone"
            dataKey="promedio"
            stroke={strokeColor}
            strokeWidth={2}
            strokeDasharray={strokeStyle}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Delta Badge Component
function DeltaBadge({ delta, trend }) {
  if (delta === null) {
    return <span className="text-sm text-slate-400">N/A</span>;
  }
  
  const bgColor = trend === 'up' 
    ? 'bg-emerald-50' 
    : trend === 'down' 
      ? 'bg-rose-50' 
      : 'bg-slate-50';
  
  const textColor = trend === 'up' 
    ? 'text-emerald-600' 
    : trend === 'down' 
      ? 'text-rose-600' 
      : 'text-slate-500';
  
  const Icon = trend === 'up' 
    ? TrendingUp 
    : trend === 'down' 
      ? TrendingDown 
      : Minus;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${bgColor} ${textColor}`}>
      <Icon size={14} />
      <span className="text-sm font-semibold">
        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
      </span>
    </div>
  );
}

// Role Change Badge
function RoleChangeBadge({ roleChange }) {
  if (!roleChange.changed) return null;
  
  return (
    <div 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs cursor-help"
      title={`Cambio de rol: ${roleChange.prev} → ${roleChange.new}`}
    >
      <ArrowRightLeft size={12} />
      <span>Rol cambió</span>
    </div>
  );
}

// Active/Inactive Badge
function StatusBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
        Activo
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
      <UserX size={12} />
      Inactivo
    </span>
  );
}

export default function EvolutionList() {
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState('promedio'); // 'promedio' | 'delta' | 'nombre'
  const [sortDir, setSortDir] = useState('desc');
  
  const collaborators = useMemo(() => {
    let data = getCollaboratorsEvolution(showInactive);
    
    // Sort
    data = [...data].sort((a, b) => {
      if (sortBy === 'nombre') {
        const cmp = a.nombre.localeCompare(b.nombre);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'delta') {
        const aVal = a.delta ?? -999;
        const bVal = b.delta ?? -999;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      // Default: promedio
      const aVal = a.latestPromedio ?? 0;
      const bVal = b.latestPromedio ?? 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return data;
  }, [showInactive, sortBy, sortDir]);
  
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };
  
  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Colaboradores</h2>
          <p className="text-sm text-slate-500">Tendencias individuales</p>
        </div>
        
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showInactive 
              ? 'bg-slate-200 text-slate-700' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Filter size={14} />
          {showInactive ? 'Mostrando inactivos' : 'Ver inactivos'}
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSort('nombre')}
              >
                <span className="flex items-center gap-1">
                  Colaborador
                  <SortIcon column="nombre" />
                </span>
              </th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Tendencia</th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSort('promedio')}
              >
                <span className="flex items-center gap-1">
                  Nivel Actual
                  <SortIcon column="promedio" />
                </span>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSort('delta')}
              >
                <span className="flex items-center gap-1">
                  Delta 6M
                  <SortIcon column="delta" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {collaborators.map((collab) => (
              <tr 
                key={collab.id} 
                className={`hover:bg-slate-50 transition-colors ${!collab.active ? 'opacity-60' : ''}`}
              >
                {/* Collaborator */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
                      ${collab.isAtRisk 
                        ? 'bg-gradient-to-br from-rose-400 to-rose-600' 
                        : collab.active 
                          ? 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                          : 'bg-gradient-to-br from-slate-300 to-slate-400'
                      }
                    `}>
                      {collab.avatar || collab.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 truncate">{collab.nombre}</p>
                        {collab.isOneShot && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs">
                            <Sparkles size={10} />
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-slate-500 truncate">{collab.latestRol}</p>
                        <RoleChangeBadge roleChange={collab.roleChange} />
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Status */}
                <td className="px-4 py-4">
                  <StatusBadge active={collab.active} />
                </td>
                
                {/* Sparkline */}
                <td className="px-4 py-4">
                  <MiniSparkline 
                    data={collab.trend} 
                    isAtRisk={collab.isAtRisk}
                    isOneShot={collab.isOneShot}
                    hasGaps={collab.hasGaps}
                  />
                </td>
                
                {/* Current Level */}
                <td className="px-4 py-4">
                  <span className="text-lg font-bold text-slate-800">
                    {collab.latestPromedio !== null ? collab.latestPromedio.toFixed(1) : '—'}
                  </span>
                </td>
                
                {/* Delta */}
                <td className="px-4 py-4">
                  <DeltaBadge delta={collab.delta} trend={collab.deltaTrend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {collaborators.length === 0 && (
        <div className="p-8 text-center text-slate-400">
          No hay colaboradores para mostrar
        </div>
      )}
    </div>
  );
}
