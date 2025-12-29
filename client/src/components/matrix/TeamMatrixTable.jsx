import { useMemo } from 'react';
import { CATEGORIES, SKILLS, COLLABORATORS, isCriticalGap } from '../../data/mockData';
import SkillCell from './SkillCell';

/**
 * TeamMatrixTable Component
 * 
 * Matriz de habilidades del equipo con:
 * - Sticky Headers (skills fijos arriba al scroll vertical)
 * - Sticky Column con sombra (nombres fijos a la izquierda al scroll horizontal)
 * - Indicadores visuales de brechas críticas (por empleado, no global)
 */
export default function TeamMatrixTable() {
  // Agrupar skills por categoría
  const skillsByCategory = useMemo(() => {
    const grouped = {};
    CATEGORIES.forEach(cat => {
      grouped[cat.id] = {
        ...cat,
        skills: SKILLS.filter(s => s.categoria === cat.id),
      };
    });
    return grouped;
  }, []);

  const categoryIds = CATEGORIES.map(c => c.id);

  // Estilos compartidos para la columna sticky
  const stickyColumnStyles = `
    sticky left-0 z-20 
    bg-surface 
    border-r-2 border-gray-200
    shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)]
  `;

  return (
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden">
      {/* Contenedor con scroll */}
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-collapse min-w-max">
          {/* Header con categorías */}
          <thead>
            {/* Fila de categorías */}
            <tr>
              <th 
                className={`
                  sticky left-0 top-0 z-30 
                  bg-primary text-white 
                  p-4 text-left font-medium 
                  min-w-[220px]
                  border-r-2 border-primary/30
                  shadow-[4px_0_6px_-2px_rgba(0,0,0,0.15)]
                `}
                rowSpan={2}
              >
                Colaborador
              </th>
              {categoryIds.map(catId => {
                const cat = skillsByCategory[catId];
                return (
                  <th
                    key={catId}
                    className="sticky top-0 z-10 bg-primary/90 text-white p-3 text-center font-medium border-l border-primary/30 whitespace-nowrap"
                    colSpan={cat.skills.length}
                  >
                    {cat.abrev}
                  </th>
                );
              })}
            </tr>
            
            {/* Fila de skills individuales */}
            <tr>
              {categoryIds.map(catId =>
                skillsByCategory[catId].skills.map((skill, idx) => (
                  <th
                    key={skill.id}
                    className={`
                      sticky top-[52px] z-10 
                      bg-primary/80 text-white 
                      p-3 text-center font-normal text-sm 
                      min-w-[140px]
                      ${idx === 0 ? 'border-l border-primary/30' : ''}
                    `}
                    title={skill.nombre}
                  >
                    <span className="whitespace-nowrap truncate max-w-[130px] block">
                      {skill.nombre}
                    </span>
                  </th>
                ))
              )}
            </tr>
          </thead>

          {/* Body con colaboradores */}
          <tbody>
            {COLLABORATORS.map((collab, empIdx) => {
              const isEven = empIdx % 2 === 0;
              const rowBg = isEven ? 'bg-gray-50' : 'bg-surface';
              
              return (
                <tr 
                  key={collab.id}
                  className={`${rowBg} hover:bg-primary/5 transition-colors`}
                >
                  {/* Nombre del colaborador (sticky con sombra) */}
                  <td 
                    className={`
                      ${stickyColumnStyles}
                      ${isEven ? 'bg-gray-50' : 'bg-surface'}
                      p-4 font-medium
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="text-primary font-medium">{collab.nombre}</span>
                      <span className="text-xs text-gray-500">{collab.rol}</span>
                    </div>
                  </td>
                  
                  {/* Celdas de skills */}
                  {categoryIds.map(catId =>
                    skillsByCategory[catId].skills.map((skill, idx) => {
                      const skillData = collab.skills[skill.id];
                      const hasCriticalGap = isCriticalGap(skillData);
                      
                      return (
                        <td 
                          key={skill.id}
                          className={`
                            p-0 text-center 
                            border-t border-gray-100
                            ${idx === 0 ? 'border-l border-gray-200' : ''}
                          `}
                        >
                          <SkillCell 
                            level={skillData?.nivel ?? 0}
                            isCriticalGap={hasCriticalGap}
                          />
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full ring-2 ring-critical">
              2
            </div>
            <span>Brecha Crítica (skill crítica + nivel &lt; 3)</span>
          </div>
          <div className="flex items-center gap-4 ml-auto text-xs text-gray-400">
            <span>0-1: Básico</span>
            <span>2: En desarrollo</span>
            <span>3-4: Competente</span>
            <span>5: Experto</span>
          </div>
        </div>
      </div>
    </div>
  );
}
