import { useState } from 'react';

// ============================================
// STATIC DATA - Datos realistas para demo
// ============================================
const STATIC_DATA = {
  promedioGeneral: '2.8',
  fortalezas: 2,
  gapsCriticos: 2,
  
  gaps: [
    { categoria: 'Cloud & DevOps', valor: 1.8 },
    { categoria: 'Arquitectura de Software', valor: 2.2 },
  ],
  
  categorias: [
    { id: 1, nombre: 'Innovación', abrev: 'INN', promedio: 2.4 },
    { id: 2, nombre: 'Desarrollo', abrev: 'DEV', promedio: 3.2 },
    { id: 3, nombre: 'Liderazgo', abrev: 'LID', promedio: 2.8 },
    { id: 4, nombre: 'Gestión', abrev: 'GES', promedio: 3.1 },
    { id: 5, nombre: 'Comunicación', abrev: 'COM', promedio: 3.4 },
    { id: 6, nombre: 'Técnico', abrev: 'TEC', promedio: 2.6 },
  ],
  
  colaboradores: [
    { id: 1, nombre: 'María González', rol: 'Product Manager', promedio: 3.2,
      categorias: { INN: 3.5, DEV: 2.8, LID: 3.4, GES: 3.8, COM: 3.2, TEC: 2.5 }},
    { id: 2, nombre: 'Carlos Rodríguez', rol: 'Tech Lead', promedio: 3.6,
      categorias: { INN: 3.2, DEV: 4.2, LID: 3.5, GES: 3.0, COM: 3.1, TEC: 4.5 }},
    { id: 3, nombre: 'Laura Martínez', rol: 'Junior Developer', promedio: 2.1,
      categorias: { INN: 1.8, DEV: 2.5, LID: 1.5, GES: 2.0, COM: 2.2, TEC: 2.6 }},
    { id: 4, nombre: 'Pedro Sánchez', rol: 'UX Designer', promedio: 2.9,
      categorias: { INN: 3.8, DEV: 2.0, LID: 2.5, GES: 3.0, COM: 3.5, TEC: 2.6 }},
    { id: 5, nombre: 'Ana Torres', rol: 'QA Engineer', promedio: 2.7,
      categorias: { INN: 2.2, DEV: 2.8, LID: 2.4, GES: 2.8, COM: 3.0, TEC: 3.0 }},
  ]
};

const getStatusColor = (nivel) => {
  if (nivel >= 3.5) return 'text-primary';
  if (nivel >= 2.5) return 'text-competent';
  return 'text-warning';
};

// ============================================
// DASHBOARD VIEW - Solo Resumen Ejecutivo
// ============================================
export default function DashboardView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light text-primary mb-2">
          Dashboard de Competencias
        </h1>
        <p className="text-gray-500">
          Resumen ejecutivo del estado de competencias del equipo
        </p>
      </div>

      {/* KPI Gigante */}
      <div className="bg-surface p-12 rounded-lg shadow-sm text-center">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
          Promedio General del Equipo
        </p>
        <p className="text-7xl font-light text-primary mb-4">
          {STATIC_DATA.promedioGeneral}
        </p>
        <div className="flex items-center justify-center gap-8 text-sm">
          <div>
            <span className="text-gray-400">de</span>
            <span className="font-semibold text-gray-600 ml-1">5.0</span>
          </div>
          <div className="text-gray-300">|</div>
          <div>
            <span className="font-semibold text-primary">{STATIC_DATA.fortalezas}</span>
            <span className="text-gray-500 ml-1">fortalezas</span>
          </div>
          <div className="text-gray-300">|</div>
          <div>
            <span className="font-semibold text-warning">{STATIC_DATA.gapsCriticos}</span>
            <span className="text-gray-500 ml-1">gaps críticos</span>
          </div>
        </div>
      </div>

      {/* Áreas de Mejora */}
      <div className="bg-surface p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-light mb-6 text-primary">
          {STATIC_DATA.gaps.length > 0
            ? `${STATIC_DATA.gaps.length} áreas requieren atención inmediata`
            : 'El equipo muestra competencias sólidas'}
        </h2>
        
        {STATIC_DATA.gaps.length > 0 && (
          <div className="space-y-4">
            {STATIC_DATA.gaps.map((gap, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-4 pb-4 ${
                  idx < STATIC_DATA.gaps.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="text-3xl font-bold text-warning mt-1">
                  {gap.valor.toFixed(1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 mb-1">{gap.categoria}</p>
                  <p className="text-sm text-gray-500">
                    Por debajo del umbral de competencia (2.5). Capacitación prioritaria requerida.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Tabla Perfil del Equipo */}
      <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm">
        <h3 className="text-xl font-light text-primary mb-6">Perfil del equipo</h3>
        
        {/* Desktop: tabla completa (>= 1024px) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-3 font-medium text-gray-800">Colaborador</th>
                <th className="text-left py-3 font-medium text-gray-800">Rol</th>
                {STATIC_DATA.categorias.map(cat => (
                  <th key={cat.id} className="text-center py-3 font-medium text-sm text-gray-500">
                    {cat.abrev}
                  </th>
                ))}
                <th className="text-center py-3 font-medium text-gray-800">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {STATIC_DATA.colaboradores.map((col) => (
                <tr 
                  key={col.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4">
                    <span className="font-medium text-primary">{col.nombre}</span>
                  </td>
                  <td className="py-4 text-sm text-gray-500">{col.rol}</td>
                  {Object.entries(col.categorias).map(([key, valor]) => (
                    <td key={key} className="text-center py-4">
                      <span className={`text-sm font-medium ${getStatusColor(valor)}`}>
                        {valor.toFixed(1)}
                      </span>
                    </td>
                  ))}
                  <td className="text-center py-4">
                    <span className={`text-lg font-medium ${getStatusColor(col.promedio)}`}>
                      {col.promedio.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Fila de promedio */}
              <tr className="bg-gray-50">
                <td className="py-4 font-medium text-gray-800" colSpan={2}>
                  Promedio del equipo
                </td>
                {STATIC_DATA.categorias.map(cat => (
                  <td key={cat.id} className="text-center py-4">
                    <span className={`font-semibold ${getStatusColor(cat.promedio)}`}>
                      {cat.promedio.toFixed(1)}
                    </span>
                  </td>
                ))}
                <td className="text-center py-4">
                  <span className="text-lg font-semibold text-primary">
                    {STATIC_DATA.promedioGeneral}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile: acordeón nativo (< 1024px) */}
        <div className="lg:hidden space-y-3">
          {STATIC_DATA.colaboradores.map((col) => (
            <details 
              key={col.id} 
              className="border border-gray-200 rounded-lg bg-white group"
            >
              <summary className="cursor-pointer p-4 flex justify-between items-center list-none [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="font-medium text-primary">{col.nombre}</p>
                  <p className="text-xs text-gray-500">{col.rol}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-light ${getStatusColor(col.promedio)}`}>
                    {col.promedio.toFixed(1)}
                  </span>
                  <svg 
                    className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(col.categorias).map(([key, valor]) => (
                    <div key={key} className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">{key}</p>
                      <p className={`font-semibold ${getStatusColor(valor)}`}>
                        {valor.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
          
          {/* Promedio del equipo - Mobile */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Promedio del equipo</span>
              <span className="text-2xl font-semibold text-primary">
                {STATIC_DATA.promedioGeneral}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
