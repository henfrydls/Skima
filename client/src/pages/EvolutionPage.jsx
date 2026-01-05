import { TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EvolutionMetrics, EvolutionMainChart, EvolutionList } from '../components/evolution';
import { getAllDates } from '../lib/evolutionLogic';

/**
 * EvolutionPage - Team Evolution & Trends Dashboard
 * 
 * Shows historical skill progression, KPIs, and individual trends
 * Using richSeedData.js chaos testing data
 */
export default function EvolutionPage() {
  const navigate = useNavigate();
  const dates = getAllDates();
  
  const dateRange = dates.length > 0 
    ? `${dates[0]} - ${dates[dates.length - 1]}`
    : 'Sin datos';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <TrendingUp size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Evolución del Equipo</h1>
                  <p className="text-sm text-slate-500">Tendencias históricas y métricas</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={16} />
              <span>{dateRange}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <EvolutionMetrics />
        
        {/* Main Chart */}
        <EvolutionMainChart />
        
        {/* Collaborator List */}
        <EvolutionList />
      </main>
    </div>
  );
}
