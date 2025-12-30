/**
 * LevelDot Component
 * 
 * Indicador visual de nivel como punto coloreado.
 * Colores basados en el nivel de competencia.
 * Incluye badge de alerta para brechas críticas (accesibilidad no-cromática).
 */
export default function LevelDot({ level, isCriticalGap = false, showLabel = true }) {
  // Redondear nivel para display
  const displayLevel = Math.round(level * 10) / 10;
  
  // Colores según nivel
  const getLevelColor = (lvl) => {
    if (lvl >= 4) return 'bg-primary text-white';
    if (lvl >= 3) return 'bg-competent text-white';
    if (lvl >= 2) return 'bg-warning text-white';
    return 'bg-gray-300 text-gray-600';
  };

  return (
    <div className="relative">
      <div 
        className={`
          w-7 h-7 rounded-full
          flex items-center justify-center
          text-xs font-medium
          ${getLevelColor(level)}
          ${isCriticalGap ? 'ring-2 ring-critical ring-offset-1' : ''}
          transition-all duration-150
          hover:scale-110
        `}
        title={`Nivel: ${displayLevel}${isCriticalGap ? ' - CRÍTICO' : ''}`}
      >
        {showLabel && displayLevel}
      </div>
      {isCriticalGap && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-critical rounded-full flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">!</span>
        </div>
      )}
    </div>
  );
}
