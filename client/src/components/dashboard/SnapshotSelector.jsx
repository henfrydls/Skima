import { useState, useMemo } from 'react';
import { Camera, Calendar, ChevronDown, ChevronUp, Clock, ArrowLeft } from 'lucide-react';

/**
 * SnapshotSelector Component - Versión Compacta
 * 
 * PRINCIPIO: El gerente viene a ver KPIs, no a seleccionar fechas.
 * El selector debe ser discreto pero accesible.
 * 
 * DISEÑO:
 * - Por defecto: Una línea compacta con el contexto actual
 * - Expandido: Panel completo con dropdowns
 * - El banner de Modo Histórico SÍ debe ser prominente (es una advertencia)
 */

// Mock data para snapshots
const MOCK_SNAPSHOTS = [
  { id: 1, label: 'Diciembre 2024', value: '2024-12', date: new Date('2024-12-29'), isCurrent: true },
  { id: 2, label: 'Septiembre 2024', value: '2024-09', date: new Date('2024-09-30'), isCurrent: false },
  { id: 3, label: 'Junio 2024', value: '2024-06', date: new Date('2024-06-30'), isCurrent: false },
  { id: 4, label: 'Marzo 2024', value: '2024-03', date: new Date('2024-03-31'), isCurrent: false },
];

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) return 'hace pocos días';
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return `hace más de 1 año`;
}

export default function SnapshotSelector({ onSnapshotChange, onCompareChange, onModeChange }) {
  const [currentSnapshot, setCurrentSnapshot] = useState(MOCK_SNAPSHOTS[0]);
  const [compareSnapshot, setCompareSnapshot] = useState(MOCK_SNAPSHOTS[2]);
  const [isExpanded, setIsExpanded] = useState(false);

  const isHistoricalMode = !currentSnapshot.isCurrent;
  const relativeTime = useMemo(() => getRelativeTime(currentSnapshot.date), [currentSnapshot]);

  const handleCurrentChange = (e) => {
    const snapshot = MOCK_SNAPSHOTS.find(s => s.value === e.target.value);
    setCurrentSnapshot(snapshot);
    onSnapshotChange?.(snapshot);
    onModeChange?.(!snapshot.isCurrent);
  };

  const handleCompareChange = (e) => {
    const snapshot = MOCK_SNAPSHOTS.find(s => s.value === e.target.value);
    setCompareSnapshot(snapshot);
    onCompareChange?.(snapshot);
  };

  const handleReturnToLive = () => {
    const liveSnapshot = MOCK_SNAPSHOTS.find(s => s.isCurrent);
    setCurrentSnapshot(liveSnapshot);
    onSnapshotChange?.(liveSnapshot);
    onModeChange?.(false);
    setIsExpanded(false);
  };

  return (
    <div className="space-y-2">
      {/* Historical Mode Banner - Solo cuando NO estamos en vivo */}
      {isHistoricalMode && (
        <div className="bg-warning/10 border-l-4 border-warning rounded-r-lg px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-warning flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-warning">Modo Histórico</span>
                <span className="text-sm text-gray-600 ml-2">
                  Viendo: <span className="font-medium">{currentSnapshot.label}</span>
                  <span className="text-gray-400 ml-1">({relativeTime})</span>
                </span>
              </div>
            </div>
            <button
              onClick={handleReturnToLive}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-competent bg-competent/10 rounded-md hover:bg-competent hover:text-white transition-all"
            >
              <ArrowLeft size={14} />
              Volver a hoy
            </button>
          </div>
        </div>
      )}

      {/* Compact Context Bar */}
      <div 
        className={`
          flex items-center justify-between gap-4 px-4 py-2 rounded-lg cursor-pointer
          transition-all duration-200
          ${isExpanded 
            ? 'bg-surface shadow-sm border border-gray-200' 
            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
          }
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Context Info */}
        <div className="flex items-center gap-3 text-sm">
          {!isHistoricalMode && (
            <span className="flex items-center gap-1.5 text-competent">
              <span className="w-1.5 h-1.5 bg-competent rounded-full animate-pulse" />
              <span className="font-medium">En vivo</span>
            </span>
          )}
          
          <span className="text-gray-400">|</span>
          
          <span className="text-gray-600">
            <Calendar size={14} className="inline mr-1 opacity-60" />
            {currentSnapshot.label}
            <span className="text-gray-400 mx-1">vs</span>
            {compareSnapshot.label}
          </span>
        </div>

        {/* Right: Expand Toggle */}
        <button 
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        >
          <span>{isExpanded ? 'Cerrar' : 'Cambiar'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-surface p-4 rounded-lg shadow-sm border border-gray-100 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Ver datos de */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Ver datos de
              </label>
              <select
                value={currentSnapshot.value}
                onChange={handleCurrentChange}
                className={`
                  w-full px-3 py-2 border rounded-lg text-sm font-medium 
                  focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer
                  ${isHistoricalMode 
                    ? 'border-warning text-warning bg-warning/5' 
                    : 'border-gray-300 text-gray-700'
                  }
                `}
              >
                {MOCK_SNAPSHOTS.map(s => (
                  <option key={s.id} value={s.value}>
                    {s.label} {s.isCurrent ? '✓ Actual' : ''}
                  </option>
                ))}
              </select>
            </div>

            <span className="hidden sm:block text-gray-300 pb-2">vs</span>

            {/* Comparar con */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Comparar con
              </label>
              <select
                value={compareSnapshot.value}
                onChange={handleCompareChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {MOCK_SNAPSHOTS.filter(s => s.value !== currentSnapshot.value).map(s => (
                  <option key={s.id} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Crear Snapshot */}
            <button
              onClick={(e) => { e.stopPropagation(); alert('📸 Próximamente: Crear snapshots'); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Crear</span>
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
            📊 Los deltas mostrados comparan {currentSnapshot.label} vs {compareSnapshot.label}
          </p>
        </div>
      )}
    </div>
  );
}
