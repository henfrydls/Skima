import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { processChartData } from '../../lib/evolutionLogic';

/**
 * EvolutionMainChart - Team Average Trend Chart
 * 
 * Area chart with gradient showing team evolution over time
 * Uses connectNulls={false} for discontinuous data visibility
 */

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-3 min-w-[140px]">
      <p className="text-sm font-semibold text-slate-800 mb-1">{data.quarter}</p>
      <p className="text-xs text-slate-500 mb-2">{data.month}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-indigo-600">
          {data.teamAverage !== null ? data.teamAverage.toFixed(1) : 'N/A'}
        </span>
        <span className="text-xs text-slate-400">promedio</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {data.count} evaluaciones
      </p>
    </div>
  );
};

export default function EvolutionMainChart() {
  const chartData = useMemo(() => processChartData(false), []);
  
  // Calculate domain for Y axis (with padding)
  const yDomain = useMemo(() => {
    const values = chartData.map(d => d.teamAverage).filter(v => v !== null);
    if (values.length === 0) return [0, 5];
    const min = Math.floor(Math.min(...values) - 0.5);
    const max = Math.ceil(Math.max(...values) + 0.5);
    return [Math.max(0, min), Math.min(5, max)];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center text-slate-400">
          <p>Sin datos de evolución disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Evolución del Equipo</h2>
          <p className="text-sm text-slate-500">Promedio general a lo largo del tiempo</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span>Promedio del equipo</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(1)}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="teamAverage"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#teamGradient)"
              connectNulls={false}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
