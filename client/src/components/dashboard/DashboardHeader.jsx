import { Clock, ChevronDown, TrendingUp } from 'lucide-react';

/**
 * DashboardHeader - Executive Dashboard Header with Time Travel
 * 
 * Left: Title and current date
 * Right: Snapshot selector for time travel comparison
 */

// TimeTravelSelect Component
function TimeTravelSelect({ snapshots = [], selectedSnapshot, onSelect, isComparing }) {
  const currentDate = new Date().toLocaleDateString('es', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="flex items-center gap-3">
      {/* Comparison Mode Indicator */}
      {isComparing && selectedSnapshot && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium animate-fade-in">
          <TrendingUp size={14} />
          <span>Comparando con: {selectedSnapshot.label}</span>
        </div>
      )}
      
      {/* Time Travel Dropdown */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
          <Clock size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
          <select
            value={selectedSnapshot?.id || 'current'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'current') {
                onSelect(null);
              } else {
                const snapshot = snapshots.find(s => s.id === parseInt(value));
                onSelect(snapshot);
              }
            }}
            className="appearance-none bg-transparent text-sm text-gray-600 focus:outline-none cursor-pointer pr-6"
          >
            <option value="current">Vista Actual</option>
            {snapshots.map(snapshot => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardHeader({ 
  snapshots = [], 
  selectedSnapshot, 
  onSnapshotSelect,
  isComparing = false 
}) {
  const currentDate = new Date().toLocaleDateString('es', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Left: Title + Date */}
      <div>
        <h1 className="text-2xl font-light text-gray-900">Resumen Ejecutivo</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{currentDate}</p>
      </div>

      {/* Right: Time Travel */}
      <TimeTravelSelect 
        snapshots={snapshots}
        selectedSnapshot={selectedSnapshot}
        onSelect={onSnapshotSelect}
        isComparing={isComparing}
      />
    </div>
  );
}
