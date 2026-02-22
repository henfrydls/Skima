import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * EvolutionList - Detailed Collaborator Table
 * Shows micro-trends using sparklines and key metrics.
 */

// Custom tooltip for sparkline - positioned above using transform
const SparklineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const pointData = payload[0].payload;
    const label = pointData.date || 'Promedio';
    
    return (
      <div 
        className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg flex flex-col items-center min-w-[60px]"
        style={{ transform: 'translateY(-40px)' }}
      >
        <span className="text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">{label}</span>
        <span className="font-mono font-bold text-emerald-300">{payload[0].value.toFixed(1)}</span>
      </div>
    );
  }
  return null;
};

const Sparkline = ({ data, color = '#6366f1' }) => {
  // If only one data point, render a dot or marker
  if (data.length === 1) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
        <span className="text-[10px] text-slate-400 font-medium">NEW</span>
      </div>
    );
  }

  // Handle gaps for sparkline (recharts handles nulls if we don't say connectNulls)
  // But here we want to just visualize the trend.
  // Data comes as [{ date, promedio }, ...]
  
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip 
            content={<SparklineTooltip />}
            cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
            offset={-20}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 100 }}
          />
          <Line 
            type="monotone" 
            dataKey="promedio" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function EvolutionList({ collaborators, timeRange = '12m' }) {
  if (!collaborators || collaborators.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-slate-50/50">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium mb-1">Sin datos de colaboradores</p>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">No se encontraron registros de evolución para el período seleccionado.</p>
      </div>
    );
  }

  // Map timeRange to readable labels
  const timeLabels = {
    '6m': 'Últimos 6 meses',
    '12m': 'Últimos 12 meses',
    '24m': 'Últimos 24 meses',
    'ytd': 'Año actual',
    'all': 'Todo el historial'
  };
  const periodLabel = timeLabels[timeRange] || timeLabels['12m'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-base font-medium text-slate-800 tracking-tight">
          Evolución Individual
          <span className="text-slate-400 font-normal"> — {periodLabel}</span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-medium">
            <tr>
              <th className="px-6 py-3 tracking-wider">Colaborador</th>
              <th className="px-4 py-3 text-center tracking-wider">Estado</th>
              <th className="px-4 py-3 text-center tracking-wider">Tendencia</th>
              <th className="px-4 py-3 text-center tracking-wider">Nivel</th>
              <th className="px-4 py-3 text-right tracking-wider">Ingreso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {collaborators.map(collab => {
              // Determine Color for Sparkline
              // Red if trend is specifically "down" (negative delta)
              // We can use the 'deltaTrend' or 'delta' from logic
              // sparklineColor comes from collab.sparklineColor (set by transformEmployeesForList)

              return (
                <tr key={collab.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                  {/* Colaborador */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                        {collab.avatar || collab.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{collab.nombre}</p>
                        <p className="text-xs text-slate-500">{collab.rol}</p>
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      collab.active 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {collab.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Micro-Tendencia */}
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <Sparkline data={collab.trend} color={collab.sparklineColor} />
                    </div>
                  </td>

                  {/* Nivel Actual */}
                  <td className="px-4 py-4 text-center">
                    {collab.latestPromedio ? (
                      <span className="text-lg font-light text-slate-800 tabular-nums">
                        {collab.latestPromedio.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">--</span>
                    )}
                  </td>

                  {/* Fecha de Ingreso */}
                  <td className="px-4 py-4 text-right">
                    {collab.joinedAt ? (
                      <span className="text-xs text-slate-500 tabular-nums">
                        {new Date(collab.joinedAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
