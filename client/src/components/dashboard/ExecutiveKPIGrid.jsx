import { TrendingUp, TrendingDown, Minus, AlertTriangle, Star, Users, Shield } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * ExecutiveKPIGrid - 4 high-impact KPI cards with delta indicators
 * 
 * 1. Índice de Madurez (General Average)
 * 2. Riesgo de Talento (Critical Gaps)
 * 3. Densidad de Expertos (% level 4-5)
 * 4. Cobertura de Roles (% meeting requirements)
 */

// Delta Badge Component
function DeltaBadge({ current, previous, invertColors = false }) {
  if (previous === null || previous === undefined) {
    return null;
  }

  const delta = current - previous;
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
      isGood ? 'text-success' : isBad ? 'text-critical' : 'text-gray-400'
    }`}>
      {isGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      <span>{isPositive ? '+' : ''}{delta.toFixed(1)}</span>
    </span>
  );
}

// Mini Sparkline
function Sparkline({ data, color = '#0d9488' }) {
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

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  previousValue, 
  subtitle, 
  icon: Icon, 
  color = 'primary',
  invertDelta = false,
  sparklineData = null,
  suffix = ''
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/5 border-primary/10',
    success: 'text-success bg-success/5 border-success/10',
    warning: 'text-warning bg-warning/5 border-warning/10',
    critical: 'text-critical bg-critical/5 border-critical/10',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        {sparklineData && (
          <Sparkline data={sparklineData} color={colorClasses[color].split(' ')[0].replace('text-', '')} />
        )}
      </div>
      
      <div className="flex items-baseline gap-3">
        <p className={`text-4xl font-light tabular-nums text-${color}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}{suffix}
        </p>
        <DeltaBadge 
          current={value} 
          previous={previousValue} 
          invertColors={invertDelta}
        />
      </div>
      
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mt-2">
        {title}
      </p>
      
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default function ExecutiveKPIGrid({ 
  metrics, 
  previousMetrics = null,
  sparklineData = {}
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Índice de Madurez - General Average */}
      <KPICard
        title="Índice de Madurez"
        value={metrics.teamAverageRaw}
        previousValue={previousMetrics?.teamAverageRaw}
        subtitle="Promedio general del equipo"
        icon={TrendingUp}
        color="primary"
        sparklineData={sparklineData.maturity}
      />

      {/* 2. Riesgo de Talento - Critical Gaps */}
      <KPICard
        title="Riesgo de Talento"
        value={metrics.criticalGaps}
        previousValue={previousMetrics?.criticalGaps}
        subtitle="Brechas críticas activas"
        icon={AlertTriangle}
        color="critical"
        invertDelta={true} // Lower is better
        suffix=""
      />

      {/* 3. Densidad de Expertos */}
      <KPICard
        title="Densidad de Expertos"
        value={metrics.expertDensity || 0}
        previousValue={previousMetrics?.expertDensity}
        subtitle="% skills en nivel 4-5"
        icon={Star}
        color="success"
        suffix="%"
      />

      {/* 4. Cobertura de Roles */}
      <KPICard
        title="Cobertura de Roles"
        value={metrics.roleCoverage || 0}
        previousValue={previousMetrics?.roleCoverage}
        subtitle="% cumpliendo requisitos mínimos"
        icon={Shield}
        color="primary"
        suffix="%"
      />
    </div>
  );
}
