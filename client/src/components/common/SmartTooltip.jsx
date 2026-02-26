import { useMemo } from 'react';

// Frequency mapping with safe fallback
const FREQUENCY_MAP = {
  'D': 'Diario',
  'S': 'Semanal',
  'M': 'Mensual',
  'Q': 'Trimestral',
  'T': 'Trimestral',
  'A': 'Anual',
  'N': 'Nunca',
  'P': 'A Demanda',
};

// Criticality mapping
const CRITICALITY_MAP = {
  'C': 'Crítico',
  'I': 'Importante',
  'D': 'Deseable',
  'N': 'N/A',
};

/**
 * SmartTooltip - Collision-Aware Floating Tooltip
 * 
 * Positioned using fixed positioning to float above all content.
 * Detects viewport boundaries and adjusts position accordingly.
 * 
 * @param {Object} props
 * @param {Object|null} props.info - { x, y, data } where data contains tooltip content
 */
export default function SmartTooltip({ info }) {
  const x = info?.x;
  const y = info?.y;
  const data = info?.data;

  // Collision detection - calculate optimal position
  const position = useMemo(() => {
    const tooltipWidth = 220;
    const tooltipHeight = 160;
    const padding = 16;
    
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    // Horizontal positioning
    let left;
    let alignRight = false;
    if (x > viewportWidth - tooltipWidth - padding) {
      // Too close to right edge - position to the left of cursor
      left = x - tooltipWidth - padding;
      alignRight = true;
    } else {
      // Normal positioning - to the right of cursor
      left = x + padding;
    }
    
    // Vertical positioning
    let top;
    let alignBottom = false;
    if (y > viewportHeight - tooltipHeight - padding) {
      // Too close to bottom - position above cursor
      top = y - tooltipHeight - padding;
      alignBottom = true;
    } else {
      // Normal positioning - below cursor
      top = y + padding;
    }
    
    // Ensure minimum boundaries
    left = Math.max(8, left);
    top = Math.max(8, top);
    
    return { left, top, alignRight, alignBottom };
  }, [x, y]);

  if (!info) return null;

  const { collaboratorName, skillName, nivel, frecuencia, criticidad, estado } = data || {};
  
  // Safe frequency/criticality display
  const freqDisplay = FREQUENCY_MAP[frecuencia] || frecuencia || 'Sin definir';
  const critDisplay = CRITICALITY_MAP[criticidad] || criticidad || 'N/A';
  
  const isCriticalGap = estado === "BRECHA CRÍTICA";
  const isAreaMejora = estado === "ÁREA DE MEJORA";

  return (
    <div 
      className="fixed z-[9999] pointer-events-none animate-fade-in"
      style={{ 
        left: position.left, 
        top: position.top,
      }}
    >
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-2xl w-[210px] border border-gray-700">
        {/* Header */}
        <p className="font-bold text-white truncate text-sm">{collaboratorName}</p>
        <p className="text-slate-400 mb-2 text-[11px] truncate">{skillName}</p>
        
        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-600 pt-2">
          <span className="text-slate-400">Nivel:</span> 
          <span className="font-mono font-bold text-right text-white">{nivel?.toFixed(1) ?? '—'}</span>
          
          <span className="text-slate-400">Requerido:</span> 
          <span className={`font-mono text-right ${criticidad === 'C' ? 'text-rose-400' : criticidad === 'I' ? 'text-amber-400' : 'text-slate-300'}`}>
            {critDisplay}
          </span>
          
          <span className="text-slate-400">Frecuencia:</span> 
          <span className="font-mono text-blue-300 text-right">{freqDisplay}</span>
        </div>
        
        {/* Status Badge */}
        {isCriticalGap && (
          <div className="mt-2 pt-2 border-t border-rose-500/30">
            <p className="text-rose-400 font-bold uppercase text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              Acción Requerida
            </p>
          </div>
        )}
        {isAreaMejora && (
          <div className="mt-2 pt-2 border-t border-amber-500/30">
            <p className="text-amber-400 font-medium uppercase text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              Plan de Desarrollo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
