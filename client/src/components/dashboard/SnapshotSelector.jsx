import { useState } from 'react';
import { Camera, Calendar, ChevronDown } from 'lucide-react';

/**
 * SnapshotSelector Component
 * 
 * Permite seleccionar y comparar snapshots históricos.
 * Feature diferenciadora: "Time Travel" para ver evolución del equipo.
 * 
 * NOTA: Actualmente usa mock data. Al conectar backend, 
 * reemplazar MOCK_SNAPSHOTS con datos de API.
 */

// Mock data para snapshots - Reemplazar con API
const MOCK_SNAPSHOTS = [
  { id: 1, label: 'Diciembre 2024', value: '2024-12', isCurrent: true },
  { id: 2, label: 'Septiembre 2024', value: '2024-09', isCurrent: false },
  { id: 3, label: 'Junio 2024', value: '2024-06', isCurrent: false },
  { id: 4, label: 'Marzo 2024', value: '2024-03', isCurrent: false },
];

export default function SnapshotSelector({ onSnapshotChange, onCompareChange, onCreateSnapshot }) {
  const [currentSnapshot, setCurrentSnapshot] = useState(MOCK_SNAPSHOTS[0]);
  const [compareSnapshot, setCompareSnapshot] = useState(MOCK_SNAPSHOTS[2]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCurrentChange = (e) => {
    const snapshot = MOCK_SNAPSHOTS.find(s => s.value === e.target.value);
    setCurrentSnapshot(snapshot);
    onSnapshotChange?.(snapshot);
  };

  const handleCompareChange = (e) => {
    const snapshot = MOCK_SNAPSHOTS.find(s => s.value === e.target.value);
    setCompareSnapshot(snapshot);
    onCompareChange?.(snapshot);
  };

  const handleCreateSnapshot = () => {
    // Mostrar feedback de "próximamente" por ahora
    setShowCreateModal(true);
    setTimeout(() => setShowCreateModal(false), 2000);
    onCreateSnapshot?.();
  };

  return (
    <div className="bg-surface p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Snapshot Selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Current Snapshot */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
              <Calendar size={12} className="inline mr-1" />
              Snapshot Actual
            </label>
            <div className="relative">
              <select
                value={currentSnapshot.value}
                onChange={handleCurrentChange}
                className="appearance-none w-full sm:w-48 px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
              >
                {MOCK_SNAPSHOTS.map(snapshot => (
                  <option key={snapshot.id} value={snapshot.value}>
                    {snapshot.label} {snapshot.isCurrent ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
  );
}
