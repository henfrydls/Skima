import { useState } from 'react';
import { TrendingUp, Activity, Calendar, ChevronDown, Check, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import EvolutionChart from '../components/evolution/EvolutionChart';
import EvolutionList from '../components/evolution/EvolutionList';
import { useEvolutionData } from '../hooks/useEvolutionData';
import { EvolutionSkeleton } from '../components/common/LoadingSkeleton';
import {
  transformChartData,
  transformEmployeesForList,
  getTopImprover,
  getSupportCount,
  calculateTeamVelocity
} from '../lib/evolutionLogic';

/**
 * EvolutionPage - Historical Trends & Team Evolution
 * 
 * Displays key metrics about team growth, top performers, and retention risks
 * using real data from the Evolution API.
 */
export default function EvolutionPage() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch evolution data from API
  const { data, loading, error, timeRange, setTimeRange } = useEvolutionData('12m');

  const timeOptions = [
    { id: '6m', label: 'Últimos 6 Meses' },
    { id: '12m', label: 'Últimos 12 Meses' },
    { id: '24m', label: 'Últimos 24 Meses' },
    { id: 'ytd', label: 'Año Actual (YTD)' },
    { id: 'all', label: 'Todo el Historial' },
  ];

  const selectedOption = timeOptions.find(o => o.id === timeRange);

  // Transform API data for components
  const chartData = data ? transformChartData(data.chartData) : [];
  const collaboratorsData = data ? transformEmployeesForList(data.employees) : [];
  const topImprover = data ? getTopImprover(data.insights) : null;
  const attentionCount = data ? getSupportCount(data.insights) : 0;
  const teamVelocity = chartData.length > 0 ? calculateTeamVelocity(chartData) : { current: null, delta: null };

  // Use API meta for maturity index if available
  const maturityIndex = data?.meta?.currentMaturityIndex ?? teamVelocity.current;
  const periodDelta = data?.meta?.periodDelta ?? teamVelocity.delta;

  // Loading state - skeleton matching page layout
  if (loading) {
    return <EvolutionSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-full bg-gray-50 -m-6 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-medium text-slate-800 mb-2">Error al cargar datos</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 -m-6 p-6 space-y-6">
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

        {/* Time Travel Selector */}
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
          value={maturityIndex ? maturityIndex.toFixed(1) : "0.0"}
          subtext="vs período anterior"
          icon={Activity}
          color="indigo"
          trend={periodDelta} 
        />

        {/* 2. TOP PERFORMER */}
        <StatCard
          title="MAYOR CRECIMIENTO"
          value={topImprover ? topImprover.nombre : "Sin datos"}
          subtext={topImprover ? "Impacto positivo en el equipo" : "Sin colaboradores con crecimiento positivo"}
          icon={TrendingUp}
          color="emerald"
          trend={topImprover ? topImprover.delta : null}
        />

        {/* 3. SUPPORT FOCUS (Constructive approach) - Clickable to Team Matrix */}
        <div 
          className="cursor-pointer group"
          onClick={() => navigate('/team-matrix?tab=colaboradores&filter=critical')}
        >
          <StatCard
            title="REQUIEREN SOPORTE"
            value={attentionCount > 0 ? `${attentionCount} Casos` : "Todo en Orden"}
            subtext={attentionCount > 0 ? "Colaboradores con brechas críticas detectadas" : "Sin alertas de rendimiento"}
            icon={LifeBuoy}
            color="amber"
            trend={attentionCount > 0 ? -1 : 0} 
            invertDelta={true} 
          />
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="w-full">
        <EvolutionChart data={chartData} meta={data?.meta} onNavigateToEvaluations={() => navigate('/settings?tab=evaluaciones')} />
      </div>

      {/* Detailed List Section */}
      <div className="w-full">
        <EvolutionList collaborators={collaboratorsData} timeRange={timeRange} />
      </div>

    </div>
  );
}
