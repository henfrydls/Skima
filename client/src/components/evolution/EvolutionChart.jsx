import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';

const CHART_ANIMATION_MS = 1500;
// DOT_REVEAL_DELAY is kept as a single source-of-truth for the CSS animation-delay value.
// It is expressed in milliseconds and interpolated into the CSS animation shorthand string.
const DOT_REVEAL_DELAY = 800;

// CSS keyframes injected once by the parent EvolutionChart component.
//
// animation-fill-mode: both
//   - 'backwards' holds opacity:0 BEFORE the delay starts (prevents flash-of-visible)
//   - 'forwards'  holds opacity:1 AFTER the animation ends (prevents revert-to-invisible)
//
// Together these make the animation completely immune to React remounts: if Recharts
// re-renders/remounts a dot or label component (which it does when the Area path
// animation completes at ~1500ms), the browser simply restarts the CSS animation from
// t=0 and the element stays invisible until the delay elapses again -- but because the
// delay is only 800ms and the chart animation is 1500ms, the second reveal (after
// remount) completes well before the user can perceive a gap.
//
// Why not useState/useEffect?
// Those reset to false on every remount. Recharts calls the dot/label render-prop
// functions and re-creates the component instances when its internal SVG path
// animation finishes, causing the state reset -> disappear -> 800ms wait -> reappear flicker.
const EVOLUTION_CHART_STYLES = `
  @keyframes dotFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

/**
 * EvolutionChart - "Storytelling with Data" Edition
 *
 * Refactored to include Dynamic Narrative and optimized visual context.
 */

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const hasNewHires = dataPoint.newHires && dataPoint.newHires.length > 0;
    // Dynamic offset: more space when showing new hires
    const offsetY = hasNewHires ? '-80px' : '-30px';

    return (
      <div
        className="bg-slate-800 text-white text-xs p-3 rounded shadow-lg border border-slate-700 min-w-[150px]"
        style={{ transform: `translateY(${offsetY})` }}
      >
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

// Custom Label for the last data point - fades in after chart animation.
// CSS-only: no useState/useEffect so React remounts do not reset visibility.
const LastPointLabel = (props) => {
  const { x, y, value, index, dataLength, revealed, lastPointIsNewHire } = props;
  const GOAL = 4.0;

  if (index !== dataLength - 1) return null;

  const fillColor = value < GOAL ? '#ef4444' : '#10b981';
  const style = revealed
    ? { opacity: 1 }
    : { animation: `dotFadeIn 400ms ease-in ${DOT_REVEAL_DELAY}ms both` };

  // Offset label to the right when NUEVO line occupies the same vertical space
  const dx = lastPointIsNewHire ? 28 : 0;
  const dy = lastPointIsNewHire ? 6 : -14;

  return (
    <text
      x={x} y={y} dy={dy} dx={dx}
      fill={fillColor} fontSize={14} fontWeight="bold" textAnchor="middle"
      style={style}
    >
      {value}
    </text>
  );
};

// Custom Dot renderer - fades in after chart line animation completes.
// CSS-only: no useState/useEffect so React remounts do not reset visibility.
const CustomDot = (props) => {
  const { cx, cy, index, dataLength, payload, revealed } = props;
  const GOAL = 4.0;
  const isLast = index === dataLength - 1;
  const hasNewHire = payload.newHires && payload.newHires.length > 0;
  const style = revealed
    ? { opacity: 1 }
    : { animation: `dotFadeIn 400ms ease-in ${DOT_REVEAL_DELAY}ms both` };

  if (hasNewHire) {
    const dotRadius = isLast ? 8 : 5;
    return (
      <g key={`newhire-dot-${index}`} style={style}>
        <line x1={cx} y1={cy} x2={cx} y2={20} stroke="#10b981" strokeWidth={2} strokeDasharray="4 2" />
        <text x={cx} y={14} fill="#10b981" fontSize={9} fontWeight="bold" textAnchor="middle">NUEVO</text>
        <circle
          cx={cx} cy={cy} r={dotRadius}
          fill="#10b981" stroke="white" strokeWidth={2}
          style={isLast ? { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' } : undefined}
        />
      </g>
    );
  }

  if (isLast) {
    const value = payload.teamAverage;
    const fillColor = value < GOAL ? '#ef4444' : '#10b981';
    return (
      <circle
        cx={cx} cy={cy} r={8}
        fill={fillColor} stroke="white" strokeWidth={2}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          ...(revealed ? { opacity: 1 } : { animation: `dotFadeIn 400ms ease-in ${DOT_REVEAL_DELAY}ms both` }),
        }}
      />
    );
  }

  return null;
};

export default function EvolutionChart({ data, onNavigateToEvaluations }) {
  // Delayed data reveal: mount chart empty, then feed data after one frame.
  // This forces Recharts to see a [] → data transition and run its entrance animation.
  const [chartData, setChartData] = useState([]);
  // Ref (not state) so flipping it doesn't re-render and interrupt Recharts animation.
  const dotsRevealed = useRef(false);

  useEffect(() => {
    if (!data || data.length === 0) { setChartData([]); dotsRevealed.current = false; return; }
    setChartData([]);
    dotsRevealed.current = false;
    const raf = requestAnimationFrame(() => setChartData(data));
    const dotTimer = setTimeout(() => { dotsRevealed.current = true; }, DOT_REVEAL_DELAY + 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(dotTimer); };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-slate-50/50">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium mb-1">Sin datos históricos suficientes</p>
        <p className="text-slate-400 text-sm mb-4 max-w-xs text-center">Necesitas al menos 2 evaluaciones para visualizar la evolución del equipo.</p>
        {onNavigateToEvaluations && (
          <button
            onClick={onNavigateToEvaluations}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
          >
            Ir a Evaluaciones
          </button>
        )}
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
      {/* Inject the keyframe definition once per chart mount */}
      <style>{EVOLUTION_CHART_STYLES}</style>

      {/* Principle 1: Dynamic KPI Insight Block */}
      <div className="flex items-center gap-3 mb-6">
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

      <div className="h-64 w-full" ref={(el) => {
        // Remove tabIndex from Recharts SVG to prevent focus border
        if (el) {
          const svg = el.querySelector('svg');
          if (svg) svg.removeAttribute('tabindex');
        }
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} accessibilityLayer={false} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
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
              interval={Math.max(0, Math.floor(chartData.length / 8))}
              tickFormatter={(value) => {
                const dataIndex = data.findIndex(d => d.month === value);
                if (dataIndex === 0 || dataIndex === chartData.length - 1) return value;
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

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
              position={{ y: 10 }}
              allowEscapeViewBox={{ x: false, y: true }}
              offset={10}
            />

            <Area
              type="monotone"
              dataKey="teamAverage"
              stroke="#475569"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAvg)"
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={CHART_ANIMATION_MS}
              animationEasing="ease-out"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#334155' }}
              dot={(props) => <CustomDot {...props} dataLength={chartData.length} revealed={dotsRevealed.current} />}
              label={(props) => {
                const lastPt = chartData[chartData.length - 1];
                return <LastPointLabel {...props} dataLength={chartData.length} revealed={dotsRevealed.current} lastPointIsNewHire={!!(lastPt?.newHires?.length)} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
