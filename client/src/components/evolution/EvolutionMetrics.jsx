import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, User } from 'lucide-react';
import { getTeamVelocity, getTopImprover, getAtRisk } from '../../lib/evolutionLogic';

/**
 * EvolutionMetrics - KPI Cards for Evolution Dashboard
 * 
 * Displays: Team Velocity, Top Improver, At Risk
 * Handles N/A states gracefully
 */
export default function EvolutionMetrics() {
  const velocity = getTeamVelocity();
  const topImprover = getTopImprover();
  const atRisk = getAtRisk();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Team Velocity Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Team Velocity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Comparativa YoY</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50">
            <Zap size={20} className="text-indigo-600" />
          </div>
        </div>
        
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-slate-800">
            {velocity.current !== null ? velocity.current.toFixed(1) : 'N/A'}
          </span>
          
          {velocity.delta !== null ? (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
              velocity.delta > 0 
                ? 'bg-emerald-50 text-emerald-600' 
                : velocity.delta < 0 
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {velocity.delta > 0 ? (
                <TrendingUp size={14} />
              ) : velocity.delta < 0 ? (
                <TrendingDown size={14} />
              ) : (
                <Minus size={14} />
              )}
              <span>{velocity.delta > 0 ? '+' : ''}{velocity.delta.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-sm text-slate-400 italic">Sin datos previos</span>
          )}
        </div>
        
        {velocity.previous !== null && (
          <p className="text-xs text-slate-400 mt-3">
            Año anterior: {velocity.previous.toFixed(1)}
          </p>
        )}
      </div>

      {/* Top Improver Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Top Improver</h3>
            <p className="text-xs text-slate-400 mt-0.5">Mayor crecimiento 6M</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
        </div>
        
        {topImprover ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {topImprover.avatar || topImprover.nombre.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{topImprover.nombre}</p>
              <p className="text-sm text-slate-500 truncate">{topImprover.rol}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-600">
                +{topImprover.delta.toFixed(1)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <User size={24} className="text-slate-300" />
            </div>
            <span className="text-sm italic">Sin datos suficientes</span>
          </div>
        )}
      </div>

      {/* At Risk Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">At Risk</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tendencia negativa 6M</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
        </div>
        
        {atRisk ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {atRisk.avatar || atRisk.nombre.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{atRisk.nombre}</p>
              <p className="text-sm text-slate-500 truncate">{atRisk.rol}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-rose-600">
                {atRisk.delta.toFixed(1)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <User size={24} className="text-slate-300" />
            </div>
            <span className="text-sm italic">Sin alertas actuales</span>
          </div>
        )}
      </div>
    </div>
  );
}
