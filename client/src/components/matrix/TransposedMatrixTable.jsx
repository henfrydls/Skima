import React, { useState, useMemo } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import LevelDot from '../common/LevelDot';

// Helper: isCriticalGap - Brecha crítica = skill con criticidad 'C' y nivel < 3
const isCriticalGap = (skillData) => {
  if (!skillData) return false;
  return skillData.criticidad === 'C' && skillData.nivel < 3;
};

/**
 * TransposedMatrixTable Component
 * 
 * Matriz de habilidades TRANSPUESTA:
 * - Filas: Skills (permite nombres largos sin cortar)
 * - Columnas: Empleados (avatares con iniciales + nombre)
 * - Agrupación visual por categoría (colapsable)
 * 
 * Props:
 * - categories: array of { id, nombre, abrev }
 * - skills: array of { id, categoria, nombre }
 * - collaborators: array of { id, nombre, rol, skills: { [skillId]: { nivel, criticidad, frecuencia } } }
 * - isLoading: boolean
 */
export default function TransposedMatrixTable({ categories = [], skills = [], collaborators = [], isLoading = false }) {
  // Estado para categorías colapsadas
  const [expandedCategories, setExpandedCategories] = useState(() =>
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );

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
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden animate-fade-in">
      {/* Contenedor con scroll */}
      <div className="overflow-x-auto max-h-[calc(100vh-200px)] border border-gray-100 rounded-lg">
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
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                      title={collab.nombre}
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
                    {collaborators.map(collab => {
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
                          {/* Rich Tooltip Container */}
                          <div className="flex items-center justify-center group relative">
                            <LevelDot 
                              level={skillData?.nivel ?? 0}
                              isCriticalGap={hasCriticalGap}
                            />
                            {/* Rich Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-max pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                                <p className="font-semibold">{collab.nombre}</p>
                                <p className="text-gray-300 text-[10px] mb-1">{skill.nombre}</p>
                                <p className="flex items-center gap-2">
                                  Nivel: <span className="font-bold">{skillData?.nivel?.toFixed(1) ?? 0}</span>
                                  {hasCriticalGap && (
                                    <span className="text-red-400 font-medium">⚠️ CRÍTICO</span>
                                  )}
                                </p>
                              </div>
                              {/* Arrow */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                            </div>
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
