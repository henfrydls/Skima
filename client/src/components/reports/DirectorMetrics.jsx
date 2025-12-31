import { 
  Target, 
  TrendingUp, 
  DollarSign,
  Gauge
} from 'lucide-react';

/**
 * DirectorMetrics — Director/CTO View
 * 
 * Focus: High-level strategic metrics
 * - Health Score (single number focus)
 * - Competency Map (category overview)
 * - Investment Priorities (ROI language)
 */

export default function DirectorMetrics({ gaps: _gaps, distribution: _distribution, categories: _categories }) {
  // Mock health score calculation
  const healthScore = 2.9;
  const healthTarget = 3.5;
  const healthPercentage = (healthScore / 5) * 100;

  // Category health map
  const categoryHealth = [
    { name: 'Innovación', score: 3.8, status: 'strength' },
    { name: 'Desarrollo', score: 2.9, status: 'competent' },
    { name: 'Liderazgo', score: 2.9, status: 'competent' },
    { name: 'Negocio', score: 2.9, status: 'competent' },
    { name: 'Entrega', score: 3.0, status: 'competent' },
    { name: 'Emergentes', score: 2.0, status: 'attention' },
  ];

  const investments = [
    { 
      area: 'Cloud & DevOps',
      impact: '80%',
      roi: 'Reducción 30% en deploy time',
      priority: 1
    },
    { 
      area: 'Backend Architecture',
      impact: '60%',
      roi: 'Reducción 20% en bugs críticos',
      priority: 2
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'strength': return 'text-competent bg-competent/10';
      case 'competent': return 'text-warning bg-warning/10';
      case 'attention': return 'text-critical bg-critical/10';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'strength': return 'Fortaleza';
      case 'competent': return 'Competente';
      case 'attention': return 'Atención';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Health Score Hero */}
      <div className="bg-surface p-8 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Gauge size={20} className="text-primary" />
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Health Score del Equipo
          </h3>
        </div>
        
        <div className="flex items-end gap-4 mb-4">
          <span className="text-5xl font-light text-primary">{healthScore.toFixed(1)}</span>
          <span className="text-2xl font-light text-gray-400">/ 5.0</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <div 
            className="bg-primary rounded-full h-3 transition-all duration-500"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            <TrendingUp size={14} className="inline mr-1 text-competent" />
            +0.3 vs Q2 2024
          </span>
          <span className="text-gray-500">
            Meta Q4: {healthTarget} (faltan {(healthTarget - healthScore).toFixed(1)})
          </span>
        </div>
      </div>

      {/* Competency Map */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Mapa de Competencias
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categoryHealth.map((cat) => (
            <div key={cat.name} className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-light text-gray-800 mb-1">{cat.score.toFixed(1)}</p>
              <p className="text-sm font-medium text-gray-700">{cat.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${getStatusColor(cat.status)}`}>
                {getStatusLabel(cat.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Priorities */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-competent" />
          Prioridades de Inversión
        </h3>
        
        <div className="space-y-4">
          {investments.map((inv) => (
            <div key={inv.area} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {inv.priority}
                    </span>
                    <h4 className="font-medium text-gray-800">{inv.area}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Impacto: {inv.impact} del equipo
                  </p>
                  <p className="text-sm text-competent mt-1">
                    ROI: {inv.roi}
                  </p>
                </div>
                <button className="text-xs text-primary hover:underline">
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
