import { useState } from 'react';
import { TrendingUp, Activity, AlertTriangle, Calendar, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import { getTeamVelocity, getTopImprover, getAtRisk } from '../lib/evolutionLogic';

/**
 * EvolutionPage - Historical Trends & Team Evolution
 * 
 * Displays key metrics about team growth, top performers, and retention risks
 * using historical data snapshots.
 */
export default function EvolutionPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('12m');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 1. Get Real Data from Logic Layer
  const velocity = getTeamVelocity();
  const topImprover = getTopImprover();
  const atRisk = getAtRisk();

  const timeOptions = [
    { id: '12m', label: 'Últimos 12 Meses' },
    { id: '24m', label: 'Últimos 24 Meses' },
    { id: 'ytd', label: 'Año Actual (YTD)' },
    { id: 'all', label: 'Todo el Historial' },
  ];

  const selectedOption = timeOptions.find(o => o.id === timeRange);

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6 space-y-6">
      {/* Header Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-slate-800">
            Evolución de Talento
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            Análisis de tendencias de competencia y retención de talento
          </p>
        </div>

        {/* Time Travel Selector (Mock) */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white hover:text-slate-800"
          >
            <Calendar size={16} className="text-slate-500" />
            <span>{selectedOption?.label}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
              {timeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setTimeRange(option.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors
                    ${timeRange === option.id 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {timeRange === option.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. VELOCITY (Crecimiento del Equipo) */}
        <StatCard
          title="VELOCIDAD DE EQUIPO"
          value={velocity.delta !== null ? `${velocity.delta > 0 ? '+' : ''}${velocity.delta}%` : '0.0%'} 
          subtext="Crecimiento anual vs 2024"
          icon={Activity}
          color="indigo"
          trend={velocity.delta} 
        />

        {/* 2. TOP PERFORMER */}
        <StatCard
          title="MAYOR CRECIMIENTO"
          value={topImprover ? topImprover.nombre : "Sin datos"}
          subtext="Impacto positivo en el equipo"
          icon={TrendingUp}
          color="emerald"
          trend={topImprover ? topImprover.delta : null}
        />

        {/* 3. RETENTION RISK */}
        <StatCard
          title="ALERTA DE RENDIMIENTO"
          value={atRisk ? atRisk.nombre : "Sin alertas"}
          subtext="Caída sostenida reciente"
          icon={AlertTriangle}
          color="rose"
          trend={atRisk ? atRisk.delta : null}
          invertDelta={true} 
        />
      </div>
    </div>
  );
}
