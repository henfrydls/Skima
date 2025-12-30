import { useState, useMemo } from 'react';
import { Camera, Calendar, ChevronDown, Clock, ArrowLeft, Radio } from 'lucide-react';

/**
 * SnapshotSelector Component - Versión Mejorada
 * 
 * Permite seleccionar y comparar snapshots históricos.
 * Feature diferenciadora: "Time Travel" para ver evolución del equipo.
 * 
 * MEJORAS:
 * - Banner "Modo Histórico" cuando no estamos en tiempo real
 * - Indicador visual claro de fecha de corte
 * - Tiempo relativo ("hace 3 meses")
 * - Botón "Volver a Actualidad"
 */

// Mock data para snapshots - Reemplazar con API
const MOCK_SNAPSHOTS = [
  { id: 1, label: 'Diciembre 2024', value: '2024-12', date: new Date('2024-12-29'), isCurrent: true },
  { id: 2, label: 'Septiembre 2024', value: '2024-09', date: new Date('2024-09-30'), isCurrent: false },
  { id: 3, label: 'Junio 2024', value: '2024-06', date: new Date('2024-06-30'), isCurrent: false },
  { id: 4, label: 'Marzo 2024', value: '2024-03', date: new Date('2024-03-31'), isCurrent: false },
];

// Helper: Calcular tiempo relativo
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) return 'hace pocos días';
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return `hace ${Math.floor(diffDays / 365)} años`;
}

// Helper: Formatear fecha completa
function formatFullDate(date) {
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

export default function SnapshotSelector({ onSnapshotChange, onCompareChange, onCreateSnapshot, onModeChange }) {
  const [currentSnapshot, setCurrentSnapshot] = useState(MOCK_SNAPSHOTS[0]);
  const [compareSnapshot, setCompareSnapshot] = useState(MOCK_SNAPSHOTS[2]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Detectar si estamos en modo histórico
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
  };

  const handleCreateSnapshot = () => {
    setShowCreateModal(true);
    setTimeout(() => setShowCreateModal(false), 2000);
    onCreateSnapshot?.();
  };

  return (
    <div className="space-y-3">
      {/* Historical Mode Banner - Solo visible cuando NO estamos en "Actualidad" */}
      {isHistoricalMode && (
        <div className="bg-warning/10 border-l-4 border-warning rounded-r-lg p-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-warning" />
              </div>
              <div>
                <p className="font-semibold text-warning flex items-center gap-2">
                  <span className="text-sm uppercase tracking-wide">Modo Histórico</span>
                </p>
                <p className="text-sm text-gray-700">
                  Viendo datos de <span className="font-semibold">{currentSnapshot.label}</span>
                  <span className="text-gray-500"> — {relativeTime}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📅 Fecha de corte: {formatFullDate(currentSnapshot.date)}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleReturnToLive}
              className="flex items-center gap-2 px-4 py-2 bg-competent/10 text-competent rounded-lg hover:bg-competent hover:text-white transition-all text-sm font-medium group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver a Actualidad
            </button>
          </div>
        </div>
      )}

      {/* Live Mode Indicator - Pequeño badge cuando estamos en tiempo real */}
      {!isHistoricalMode && (
        <div className="flex items-center gap-2 text-xs text-competent">
          <span className="w-2 h-2 bg-competent rounded-full animate-pulse" />
          <span className="font-medium">En vivo — {currentSnapshot.label}</span>
        </div>
      )}

      {/* Main Selector Card */}
      <div className={`
        bg-surface p-4 rounded-lg shadow-sm border transition-all duration-300
        ${isHistoricalMode ? 'border-warning/30 ring-1 ring-warning/20' : 'border-gray-100'}
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Snapshot Selectors */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Current Snapshot */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                <Calendar size={12} className="inline mr-1" />
                Ver datos de
              </label>
              <div className="relative">
                <select
                  value={currentSnapshot.value}
                  onChange={handleCurrentChange}
                  className={`
                    appearance-none w-full sm:w-48 px-3 py-2 pr-10 border rounded-lg bg-white text-sm font-medium 
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
                    transition-colors cursor-pointer
                    ${isHistoricalMode 
                      ? 'border-warning text-warning' 
                      : 'border-gray-300 text-gray-700'
                    }
                  `}
                >
                  {MOCK_SNAPSHOTS.map(snapshot => (
                    <option key={snapshot.id} value={snapshot.value}>
                      {snapshot.label} {snapshot.isCurrent ? '✓ Actual' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className={`
                  absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
                  ${isHistoricalMode ? 'text-warning' : 'text-gray-400'}
                `} />
              </div>
            </div>

            {/* VS Separator */}
            <span className="hidden sm:block text-gray-300 font-medium px-2">vs</span>

            {/* Compare Snapshot */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                <Calendar size={12} className="inline mr-1" />
                Comparar con
              </label>
              <div className="relative">
                <select
                  value={compareSnapshot.value}
                  onChange={handleCompareChange}
                  className="appearance-none w-full sm:w-48 px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
                >
                  {MOCK_SNAPSHOTS.filter(s => s.value !== currentSnapshot.value).map(snapshot => (
                    <option key={snapshot.id} value={snapshot.value}>
                      {snapshot.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Create Snapshot Button */}
          <div className="relative">
            <button
              onClick={handleCreateSnapshot}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 font-medium text-sm"
            >
              <Camera size={16} />
              Crear Snapshot
            </button>
            
            {/* Coming Soon Tooltip */}
            {showCreateModal && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  📸 Próximamente: Crear snapshots manuales
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Travel Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            📊 Comparando: <span className="font-medium text-gray-700">{currentSnapshot.label}</span>
            {' '}vs{' '}
            <span className="font-medium text-gray-700">{compareSnapshot.label}</span>
            {' '}— Los delta mostrados reflejan esta comparación.
          </p>
        </div>
      </div>
    </div>
  );
}
