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

  // Glow color según nivel (para hover)
  const getGlowColor = (lvl) => {
    if (lvl >= 4) return 'hover:shadow-[0_0_10px_rgba(45,103,110,0.4)]';
    if (lvl >= 3) return 'hover:shadow-[0_0_10px_rgba(166,174,61,0.4)]';
    if (lvl >= 2) return 'hover:shadow-[0_0_10px_rgba(218,138,12,0.4)]';
    return 'hover:shadow-[0_0_10px_rgba(156,163,175,0.4)]';
  };

  return (
    <div className="relative">
      <div 
        className={`
          w-8 h-8 rounded-full
          flex items-center justify-center
          text-xs font-medium
          ${getLevelColor(level)}
          ${getGlowColor(level)}
          ${isCriticalGap ? 'ring-2 ring-critical ring-offset-1' : ''}
          transition-all duration-150
          hover:scale-110 active:scale-95
          cursor-pointer
        `}
        title={`Nivel: ${displayLevel}${isCriticalGap ? ' - CRÍTICO' : ''}`}
      >
        {showLabel && displayLevel}
      </div>
      {isCriticalGap && (
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-critical rounded-full flex items-center justify-center shadow-sm animate-pulse">
          <span className="text-white text-[9px] font-bold leading-none">!</span>
        </div>
      )}
    </div>
  );
}

