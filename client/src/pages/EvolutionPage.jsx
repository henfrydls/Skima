import { useState } from 'react';
import { TrendingUp, Activity, AlertTriangle, Calendar, ChevronDown, Check, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import EvolutionChart from '../components/evolution/EvolutionChart';
import EvolutionList from '../components/evolution/EvolutionList';
import { 
  calculateEvolutionMetrics,
  processChartData,
  getCollaboratorsEvolution
} from '../lib/evolutionLogic';

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

  // 1. Get Real Data from Logic Layer (Aggregated)
  const { topImprover, attentionCount, teamVelocity } = calculateEvolutionMetrics();
  
  const chartData = processChartData(false); // Exclude inactives for chart
  const collaboratorsData = getCollaboratorsEvolution(true); // Include inactives for list

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
        
        {/* 1. MATURITY INDEX (Índice de Madurez) */}
        <StatCard
          title="ÍNDICE DE MADUREZ"
          value={teamVelocity.current ? teamVelocity.current.toFixed(1) : "0.0"}
          subtext="vs año anterior"
          icon={Activity}
          color="indigo"
          trend={teamVelocity.delta} 
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

        {/* 3. SUPPORT FOCUS (Constructive approach) */}
        <div className="cursor-pointer group">
          <StatCard
            title="REQUIEREN SOPORTE"
            value={attentionCount > 0 ? `${attentionCount} Casos` : "Todo en Orden"}
            subtext="Colaboradores con tendencia a la baja"
            icon={LifeBuoy}
            color="amber"
            trend={attentionCount > 0 ? -1 : 0} 
            invertDelta={true} 
          />
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="w-full">
        <EvolutionChart data={chartData} />
      </div>

      {/* Detailed List Section */}
      <div className="w-full">
        <EvolutionList collaborators={collaboratorsData} timeRange={timeRange} />
      </div>

    </div>
  );
}
