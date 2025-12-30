/**
 * LevelDot Component
 * 
 * Indicador visual de nivel como punto coloreado.
 * Colores basados en el nivel de competencia.
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
    <div 
      className={`
        w-8 h-8 rounded-full
        flex items-center justify-center
        text-xs font-medium
        ${getLevelColor(level)}
        ${isCriticalGap ? 'ring-2 ring-critical ring-offset-1' : ''}
        transition-all
      `}
      title={`Nivel: ${displayLevel}`}
    >
      {showLabel && displayLevel}
    </div>
  );
}
