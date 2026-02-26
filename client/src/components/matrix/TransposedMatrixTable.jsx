import React, { useState, useMemo } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { evaluarSkill } from '../../lib/skillsLogic';
import SmartTooltip from '../common/SmartTooltip';

/**
 * TransposedMatrixTable Component
 * 
 * Matriz de habilidades TRANSPUESTA:
 * - Filas: Skills (permite nombres largos sin cortar)
 * - Columnas: Empleados (avatares con iniciales + nombre)
 * - Agrupación visual por categoría (colapsable)
 * - Smart Tooltip con detección de colisiones
 * 
 * Props:
 * - categories: array of { id, nombre, abrev }
 * - skills: array of { id, categoria, nombre }
 * - collaborators: array of { id, nombre, rol, skills: { [skillId]: { nivel, criticidad, frecuencia } } }
 * - isLoading: boolean
 * - onCellClick: (collaboratorId, skillId) => void - Drill-down handler
 */
export default function TransposedMatrixTable({ 
  categories = [], 
  skills = [], 
  collaborators = [], 
  isLoading = false,
  onCellClick = null
}) {
  // Estado para categorías colapsadas
  const [expandedCategories, setExpandedCategories] = useState(() =>
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );
  
  // Estado para el tooltip flotante
  const [hoverInfo, setHoverInfo] = useState(null);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Agrupar skills por categoría
  const skillsByCategory = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      skills: skills.filter(s => s.categoria === cat.id),
    }));
  }, [categories, skills]);

  // Estilos para celda sticky izquierda
  const stickyLeftStyles = `
    sticky left-0 z-20 
    bg-surface
    border-r-2 border-gray-200
    shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]
  `;

  // Handler para mostrar tooltip
  const handleCellHover = (e, collab, skill, skillData) => {
    const nivel = skillData?.nivel ?? 0;
    const frecuencia = skillData?.frecuencia || 'N';
    const criticidad = skillData?.criticidad || 'N';
    const evaluacion = evaluarSkill(nivel, frecuencia, criticidad);
    
    setHoverInfo({
      x: e.clientX,
      y: e.clientY,
      data: {
        collaboratorName: collab.nombre,
        skillName: skill.nombre,
        nivel,
        frecuencia,
        criticidad,
        estado: evaluacion.estado
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!collaborators.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        No hay datos de colaboradores
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden animate-fade-in flex flex-col">
      {/* Contenedor con scroll - max-h caps height for large datasets, shrinks naturally for small ones */}
      <div className="overflow-auto border border-gray-100 rounded-lg max-h-[calc(100vh-280px)]">
        <table className="w-full border-collapse">
          {/* Header: Empleados como columnas */}
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
              
              {/* Headers de empleados */}
              {collaborators.map(collab => (
                <th
                  key={collab.id}
                  className="sticky top-0 z-10 bg-gray-50 p-2 text-center min-w-[60px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => onCellClick?.(collab.id, null)}
                    >
                      {collab.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-[10px] text-gray-500 truncate max-w-[55px]">
                      {collab.nombre.split(' ')[0]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body: Skills como filas, agrupadas por categoría */}
          <tbody>
            {skillsByCategory.map(category => (
              <React.Fragment key={`cat-group-${category.id}`}>
                {/* Header de categoría - Colapsable */}
                <tr key={`cat-${category.id}`}>
                  <td 
                    colSpan={collaborators.length + 1}
                    className="bg-gray-100 p-2 text-sm font-medium text-gray-700 border-t-2 border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${expandedCategories[category.id] ? '' : '-rotate-90'}`}
                      />
                      {category.nombre}
                      <span className="text-xs text-gray-500">
                        ({category.skills.length} skills)
                      </span>
                    </div>
                  </td>
                </tr>
                
                {/* Skills de esta categoría */}
                {expandedCategories[category.id] && category.skills.map((skill, skillIdx) => (
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
                    {collaborators.map(collab => {
                      const skillData = collab.skills[skill.id];
                      const nivel = skillData?.nivel ?? 0;
                      const frecuencia = skillData?.frecuencia || 'N';
                      const criticidad = skillData?.criticidad || 'N';
                      
                      // Use evaluarSkill for business logic
                      const evaluacion = evaluarSkill(nivel, frecuencia, criticidad);
                      const isCriticalGap = evaluacion.estado === "BRECHA CRÍTICA";
                      const isAreaMejora = evaluacion.estado === "ÁREA DE MEJORA";
                      
                      return (
                        <td 
                          key={collab.id}
                          className={`
                            p-2 text-center border-t border-gray-100
                            ${isCriticalGap ? 'bg-rose-50' : isAreaMejora ? 'bg-amber-50/50' : ''}
                          `}
                        >
                          {/* Cell Container - NO title attribute */}
                          <div
                            className={`
                              flex items-center justify-center relative rounded-full
                              ${onCellClick ? 'cursor-pointer' : ''}
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                            `}
                            tabIndex={onCellClick ? 0 : undefined}
                            role={onCellClick ? 'button' : undefined}
                            aria-label={`${collab.nombre}: ${skill.nombre} - Nivel ${nivel}`}
                            onKeyDown={(e) => {
                              if (onCellClick && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                onCellClick(collab.id, skill.id);
                              }
                            }}
                            onClick={() => onCellClick?.(collab.id, skill.id)}
                            onMouseEnter={(e) => handleCellHover(e, collab, skill, skillData)}
                            onMouseLeave={() => setHoverInfo(null)}
                          >
                            {/* Level Dot */}
                            <div 
                              className={`
                                w-8 h-8 rounded-full
                                flex items-center justify-center
                                text-xs font-medium text-white
                                ${nivel >= 4 ? 'bg-primary' : 
                                  nivel >= 3 ? 'bg-competent' : 
                                  nivel >= 2 ? 'bg-warning' : 
                                  'bg-gray-300 text-gray-600'}
                                ${isCriticalGap ? 'ring-2 ring-rose-500 ring-offset-1' : ''}
                                ${isAreaMejora ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                                transition-all duration-150
                                hover:scale-110 active:scale-95
                              `}
                            >
                              {nivel > 0 ? nivel.toFixed(1) : '—'}
                            </div>
                            
                            {/* Critical Gap Badge */}
                            {isCriticalGap && (
                              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                                <span className="text-white text-[9px] font-bold leading-none">!</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
            <div className="w-4 h-4 rounded-full bg-gray-300 ring-2 ring-rose-500 ring-offset-1" />
            <span className="text-xs">Brecha Crítica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300 ring-2 ring-amber-400 ring-offset-1" />
            <span className="text-xs">Área de Mejora</span>
          </div>
        </div>
      </div>
      
      {/* Smart Floating Tooltip - Rendered outside table for proper positioning */}
      <SmartTooltip info={hoverInfo} />
    </div>
  );
}
