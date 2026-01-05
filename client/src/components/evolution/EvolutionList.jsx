import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * EvolutionList - Detailed Collaborator Table
 * Shows micro-trends using sparklines and key metrics.
 */

// Custom tooltip for sparkline
const SparklineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg">
        <span className="font-mono">{payload[0].value.toFixed(1)}</span>
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
            cursor={false}
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
  if (!collaborators || collaborators.length === 0) return null;

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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4 font-bold border-b border-slate-100" style={{ width: '35%' }}>Colaborador</th>
              <th className="px-4 py-4 font-bold border-b border-slate-100 text-center" style={{ width: '12%' }}>Estado</th>
              <th className="px-4 py-4 font-bold border-b border-slate-100 text-center" style={{ width: '20%' }}>Tendencia</th>
              <th className="px-4 py-4 font-bold border-b border-slate-100 text-center" style={{ width: '13%' }}>Nivel</th>
              <th className="px-4 py-4 font-bold border-b border-slate-100 text-right" style={{ width: '20%' }}>Ingreso</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {collaborators.map((collab) => {
              // Determine Color for Sparkline
              // Red if trend is specifically "down" (negative delta)
              // We can use the 'deltaTrend' or 'delta' from logic
              const isDecline = collab.deltaTrend === 'down';
              const sparklineColor = isDecline ? '#e11d48' : '#6366f1'; 

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
                      <Sparkline data={collab.trend} color={sparklineColor} />
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
