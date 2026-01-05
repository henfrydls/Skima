import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * EvolutionPage - Coming Soon Placeholder
 * 
 * Minimalist empty state for the Evolution module.
 * Replaces the previous implementation as per design decision.
 */
export default function EvolutionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/50">

      {/* Main Content - Centered Message */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
          
          {/* Icon Hero */}
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8 shadow-sm">
            <TrendingUp size={40} className="text-slate-400" />
          </div>
          
          {/* Typography */}
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Módulo de Evolución en Construcción
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Estamos preparando un análisis histórico detallado para tu equipo. 
              Pronto podrás ver tendencias, ROI y riesgos de retención.
            </p>
          </div>

          {/* Optional: Action Button back to Dashboard */}
          <div className="mt-10">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
