import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';

/**
 * EvolutionChart - "Storytelling with Data" Edition
 * 
 * Refactored to include Dynamic Narrative and optimized visual context.
 */

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const hasNewHires = dataPoint.newHires && dataPoint.newHires.length > 0;

    return (
      <div className="bg-slate-800 text-white text-xs p-3 rounded shadow-lg border border-slate-700 min-w-[150px]">
        <p className="font-bold mb-2 border-b border-slate-600 pb-1">{label}</p>
        <p className="mb-1">Promedio: <span className="font-mono text-indigo-300 text-sm">{payload[0].value}</span></p>
        
        {hasNewHires && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            <p className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
              <span>🎉 Nuevos Ingresos:</span>
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
              {dataPoint.newHires.map((name, idx) => (
                <li key={idx} className="truncate">{name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Label for the last data point - Red if below goal, with bold styling
const LastPointLabel = (props) => {
  const { x, y, value, index, dataLength } = props;
  const GOAL = 4.0;
  
  if (index !== dataLength - 1) return null;

  // Determine color based on whether value meets goal
  const isBelowGoal = value < GOAL;
  const fillColor = isBelowGoal ? '#ef4444' : '#10b981'; // Red if below, Green if at/above

  return (
    <text 
      x={x} 
      y={y} 
      dy={-14} 
      dx={0} 
      fill={fillColor} 
      fontSize={14} 
      fontWeight="bold" 
      textAnchor="middle"
    >
      {value}
    </text>
  );
};

// Custom Dot renderer - shows last point special and new hire markers
const CustomDot = (props) => {
  const { cx, cy, index, dataLength, payload } = props;
  const GOAL = 4.0;
  const isLast = index === dataLength - 1;
  const hasNewHire = payload.newHires && payload.newHires.length > 0;
  
  // Render new hire vertical line from bottom to top
  if (hasNewHire) {
    return (
      <g key={`newhire-dot-${index}`}>
        {/* Vertical line */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={20}
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
        {/* Label at top */}
        <text
          x={cx}
          y={14}
          fill="#10b981"
          fontSize={9}
          fontWeight="bold"
          textAnchor="middle"
        >
          NUEVO
        </text>
        {/* Green dot on line */}
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#10b981"
          stroke="white"
          strokeWidth={2}
        />
      </g>
    );
  }
  
  // Only render special dot for last point
  if (isLast) {
    const value = payload.teamAverage;
    const isBelowGoal = value < GOAL;
    const fillColor = isBelowGoal ? '#ef4444' : '#10b981';

    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={8} 
        fill={fillColor} 
        stroke="white" 
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      />
    );
  }
  
  return null;
};

export default function EvolutionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Sin datos históricos suficientes</p>
      </div>
    );
  }

  // 1. Dynamic Narrative Logic
  const generateNarrative = (chartData) => {
    const firstVal = chartData[0].teamAverage;
    const lastVal = chartData[chartData.length - 1].teamAverage;
    const delta = lastVal - firstVal;
    
    // Default: Stable
    let result = {
      icon: '→',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      titlePrefix: 'El rendimiento se mantiene ',
      titleHighlight: 'estable',
      highlightColor: 'text-slate-700 font-semibold',
      subtitle: 'Variaciones menores en los últimos 12 meses.',
      variant: 'neutral'
    };

    if (delta > 0.1) {
      result = {
        icon: '↑',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        titlePrefix: 'Mejora constante: ',
        titleHighlight: `+${delta.toFixed(1)} puntos`,
        highlightColor: 'text-emerald-600 font-semibold',
        subtitle: 'El equipo ha ganado tracción en los últimos meses.',
        variant: 'success'
      };
    } else if (delta < -0.1) {
      const drop = Math.abs(delta).toFixed(1);
      result = {
        icon: '↓',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-600',
        titlePrefix: 'El promedio ha descendido ',
        titleHighlight: `${drop} puntos`,
        highlightColor: 'text-rose-600 font-semibold',
        subtitle: 'Se recomienda revisar las áreas de brechas críticas.',
        variant: 'warning'
      };
    }

    return result;
  };

  const narrative = generateNarrative(data);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96">
      {/* Principle 1: Dynamic KPI Insight Block */}
      <div className="flex items-start gap-3 mb-6">
        {/* Icon Indicator */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${narrative.iconBg} flex items-center justify-center`}>
          <span className={`text-lg font-bold ${narrative.iconColor}`}>{narrative.icon}</span>
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-slate-800 leading-snug">
            {narrative.titlePrefix}
            <span className={narrative.highlightColor}>{narrative.titleHighlight}</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {narrative.subtitle}
          </p>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#475569" stopOpacity={0.1}/> 
                <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94a3b8' }} 
              dy={10}
              interval={Math.max(0, Math.floor(data.length / 8))}
              tickFormatter={(value, index) => {
                // Show every ~3 months to avoid crowding
                const dataIndex = data.findIndex(d => d.month === value);
                if (dataIndex === 0 || dataIndex === data.length - 1) return value;
                return dataIndex % 3 === 0 ? value : '';
              }}
            />
            
            <YAxis 
              domain={[1, 5]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94a3b8' }} 
            />
            
            {/* Principle 2: Reference Line (Fixed overlap) */}
            <ReferenceLine y={4.0} stroke="#a5b4fc" strokeDasharray="3 3">
              <Label 
                value="Meta: Fortaleza (4.0)" 
                position="insideTopLeft" 
                fill="#64748b" 
                fontSize={11} 
                fontWeight="bold"
                offset={10}
                dy={-25}
              />
            </ReferenceLine>

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
            
            <Area 
              type="monotone" 
              dataKey="teamAverage" 
              stroke="#475569" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorAvg)" 
              connectNulls={false} 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#334155' }}
              dot={(props) => <CustomDot {...props} dataLength={data.length} />}
              label={(props) => <LastPointLabel {...props} dataLength={data.length} />} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
