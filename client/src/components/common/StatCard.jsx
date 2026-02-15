import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { InfoPopover } from '../help';

/**
 * StatCard - Reusable KPI Card Component
 * Extracted from ExecutiveKPIGrid for standardizing across the app.
 * 
 * Logic: "Pixel-perfect" match of the Dashboard design.
 */

// Delta Badge Component (Internal)
function DeltaBadge({ value, previousValue, trend, invertColors = false }) {
  // Logic: Use provided trend (delta) OR calculate from previousValue
  let delta = trend;
  
  if (delta === undefined || delta === null) {
    if (previousValue !== undefined && previousValue !== null && value !== undefined && value !== null) {
      delta = value - previousValue;
    } else {
      return null; // No data to show trend
    }
  }

  const isPositive = delta > 0;
  const isNegative = delta < 0;
  
  // For "risk" metrics, lower is better (invertColors)
  const isGood = invertColors ? isNegative : isPositive;
  const isBad = invertColors ? isPositive : isNegative;

  if (Math.abs(delta) < 0.05) {
    return (
      <span className="flex items-center gap-1 text-sm text-gray-400">
        <Minus size={14} />
        <span>0.0</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${
      isGood ? 'text-emerald-600' : isBad ? 'text-rose-600' : 'text-gray-400'
    }`}>
      {isGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      <span>{isPositive ? '+' : ''}{delta.toFixed(1)}</span>
    </span>
  );
}

// Mini Sparkline (Internal)
function Sparkline({ data, color = '#6366f1' }) {
  if (!data || data.length < 2) {
    return <div className="w-16 h-8 bg-gray-50 rounded" />;
  }

  const chartData = data.map((value, i) => ({ value, index: i }));

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Main Component
export default function StatCard({
  title,
  value,
  subtext, // mapped to subtitle
  icon: Icon,
  trend, // explicit delta
  previousValue, // calculation fallback
  color = 'indigo', // default color if not specified
  invertDelta = false,
  sparklineData = null,
  suffix = '',
  helpContent = null, // Optional: InfoPopover content (JSX or string)
  helpAlign = 'center', // Optional: InfoPopover alignment ('center', 'left', 'right')
  helpText = null // Optional: Inline contextual help below subtext
}) {
  // Map abstract colors to Tailwind classes
  // Supporting both semantic names (primary) and direct colors (indigo)
  const colorMap = {
    // Theme colors (Dashboard legacy)
    primary: 'text-indigo-600 bg-indigo-50 border-indigo-100', // Assumed primary is indigo
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    warning: 'text-amber-500 bg-amber-50 border-amber-100',
    critical: 'text-rose-600 bg-rose-50 border-rose-100',
    
    // Direct colors
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    amber: 'text-amber-500 bg-amber-50 border-amber-100',
    slate: 'text-slate-600 bg-slate-50 border-slate-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
  };

  const selectedClasses = colorMap[color] || colorMap.indigo;
  // Extract just the hex/text color for sparkline stroke
  const getStrokeColor = (col) => {
    // Rough mapping for sparkline stroke
    if (col.includes('rose') || col === 'critical') return '#e11d48';
    if (col.includes('emerald') || col === 'success') return '#059669';
    if (col.includes('amber') || col === 'warning') return '#d97706';
    return '#4f46e5'; // indigo
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${selectedClasses}`}>
          {Icon && <Icon size={20} />}
        </div>
        {sparklineData && (
          <Sparkline data={sparklineData} color={getStrokeColor(color)} />
        )}
      </div>
      
      <div className="flex items-baseline gap-3">
        <p
          key={typeof value === 'number' ? value.toFixed(1) : String(value)}
          className="text-4xl font-light tabular-nums text-slate-800 animate-value-pop"
        >
          {typeof value === 'number' ? value.toFixed(1) : value}{suffix}
        </p>
        <DeltaBadge 
          value={value}
          previousValue={previousValue}
          trend={trend}
          invertColors={invertDelta}
        />
      </div>
      
      <div className="flex items-center gap-1.5 mt-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {title}
        </p>
        {helpContent && (
          <InfoPopover title={title} align={helpAlign}>
            {helpContent}
          </InfoPopover>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      )}

      {helpText && (
        <p className="text-[11px] text-gray-400 italic mt-1.5">{helpText}</p>
      )}
    </div>
  );
}
