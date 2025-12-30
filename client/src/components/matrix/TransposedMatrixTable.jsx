import { useMemo } from 'react';
import { CATEGORIES, SKILLS, COLLABORATORS, isCriticalGap } from '../../data/mockData';
import Avatar from '../common/Avatar';
import LevelDot from '../common/LevelDot';

/**
 * TransposedMatrixTable Component
 * 
 * Matriz de habilidades TRANSPUESTA:
 * - Filas: Skills (permite nombres largos sin cortar)
 * - Columnas: Empleados (avatares con iniciales)
 * - Agrupación visual por categoría
 */
export default function TransposedMatrixTable() {
  // Agrupar skills por categoría
  const skillsByCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      ...cat,
      skills: SKILLS.filter(s => s.categoria === cat.id),
    }));
  }, []);

  // Estilos para celda sticky izquierda
  const stickyLeftStyles = `
    sticky left-0 z-20 
    bg-surface
    border-r-2 border-gray-200
    shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]
  `;

  return (
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden">
      {/* Contenedor con scroll */}
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-collapse">
          {/* Header: Empleados como columnas - Estilo Heatmap Minimalista */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* Celda esquina: Skill */}
              <th 
                className={`
                  sticky left-0 top-0 z-30 
                  bg-gray-50 
                  p-3 text-left font-medium text-gray-600
                  min-w-[280px] w-[280px]
                  border-r border-gray-200
                  shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]
                `}
              >
                <span className="text-sm">Skill</span>
              </th>
              
              {/* Headers de empleados - Avatares circulares */}
              {COLLABORATORS.map(collab => (
                <th
                  key={collab.id}
                  className="sticky top-0 z-10 bg-gray-50 p-2 text-center min-w-[60px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                      title={collab.nombre}
                    >
                      {collab.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>


          {/* Body: Skills como filas, agrupadas por categoría */}
          <tbody>
            {skillsByCategory.map(category => (
              <>
                {/* Header de categoría */}
                <tr key={`cat-${category.id}`}>
                  <td 
                    colSpan={COLLABORATORS.length + 1}
                    className="bg-gray-100 p-2 text-sm font-medium text-gray-700 border-t-2 border-gray-200"
                  >
                    {category.nombre}
                  </td>
                </tr>
                
                {/* Skills de esta categoría */}
                {category.skills.map((skill, skillIdx) => (
                  <tr 
                    key={skill.id}
                    className={`
                      ${skillIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      hover:bg-primary/5 transition-colors
                    `}
                  >
                    {/* Nombre del skill (sticky izquierda) */}
                    <td 
                      className={`
                        ${stickyLeftStyles}
                        ${skillIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        p-3 text-sm max-w-[280px]
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span 
                          className="text-gray-800 truncate" 
                          title={skill.nombre}
                        >
                          {skill.nombre}
                        </span>
                        {skill.nombre.length > 35 && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            #{skill.id}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Celdas de nivel por empleado */}
                    {COLLABORATORS.map(collab => {
                      const skillData = collab.skills[skill.id];
                      const hasCriticalGap = isCriticalGap(skillData);
                      
                      return (
                        <td 
                          key={collab.id}
                          className={`
                            p-2 text-center border-t border-gray-100
                            ${hasCriticalGap ? 'bg-critical/5' : ''}
                          `}
                        >
                          <div className="flex items-center justify-center">
                            <LevelDot 
                              level={skillData?.nivel ?? 0}
                              isCriticalGap={hasCriticalGap}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">Niveles:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-gray-300" />
            <span className="text-xs">0-1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-warning" />
            <span className="text-xs">2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-competent" />
            <span className="text-xs">3-4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span className="text-xs">5</span>
          </div>
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
            <div className="w-4 h-4 rounded-full bg-gray-300 ring-2 ring-critical ring-offset-1" />
            <span className="text-xs">Brecha Crítica</span>
          </div>
        </div>
      </div>
    </div>
  );
}
