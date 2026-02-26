import Badge from '../common/Badge';

/**
 * SkillCell Component
 * 
 * Celda individual en la matriz que muestra el nivel de una skill
 * con indicador visual de brecha crítica (por empleado).
 */
export default function SkillCell({ level, isCriticalGap = false }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[48px] p-2">
      <Badge 
        level={level} 
        className={isCriticalGap ? 'ring-2 ring-critical' : ''}
      />
    </div>
  );
}
