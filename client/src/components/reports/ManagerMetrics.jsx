import { 
  AlertTriangle, 
  Target, 
  Users, 
  ArrowRight, 
  TrendingUp,
  Zap
} from 'lucide-react';

/**
 * ManagerMetrics — Team Manager View
 * 
 * Focus: Actionable insights for direct team management
 * - Critical gaps affecting team
 * - Bus factor risks
 * - Recommended actions
 */

export default function ManagerMetrics({ gaps, distribution }) {
  // Mock data for bus factor
  const busFactor = [
    { skill: 'Cloud & DevOps', owner: 'Carlos Rodríguez', backup: null, risk: 'high' },
    { skill: 'Backend Architecture', owner: 'Carlos Rodríguez', backup: 'Pedro Sánchez', risk: 'medium' },
  ];

  const actions = [
    { 
      priority: 1,
      title: 'Capacitar a Laura Torres en Cloud',
      impact: 'Alto',
      urgency: 'Alta',
      reason: 'Gap crítico en habilidad core'
    },
    { 
      priority: 2,
      title: 'Cross-training en Backend',
      impact: 'Alto',
      urgency: 'Media',
      reason: 'Bus factor risk - solo Carlos domina'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-3xl font-light tabular-nums text-critical">{gaps?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Gaps Críticos</p>
        </div>
        <div className="bg-surface p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-3xl font-light tabular-nums text-warning">{busFactor.filter(b => b.risk === 'high').length}</p>
          <p className="text-xs text-gray-500 mt-1">Bus Factor Risks</p>
        </div>
        <div className="bg-surface p-4 rounded-lg border border-gray-100 text-center">
          <p className="text-3xl font-light tabular-nums text-primary">{distribution?.proficient || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Competentes</p>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Zap size={16} className="text-warning" />
          Acciones Recomendadas
        </h3>
        
        <div className="space-y-4">
          {actions.map((action) => (
            <div key={action.priority} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {action.priority}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{action.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{action.reason}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      Impacto: {action.impact}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      action.urgency === 'Alta' ? 'bg-critical/10 text-critical' : 'bg-warning/10 text-warning'
                    }`}>
                      Urgencia: {action.urgency}
                    </span>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bus Factor Risks */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-critical" />
          Riesgos de Bus Factor
        </h3>
        
        <div className="space-y-3">
          {busFactor.map((item) => (
            <div key={item.skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{item.skill}</p>
                <p className="text-xs text-gray-500">
                  Solo {item.owner} domina
                  {item.backup && ` • Backup: ${item.backup}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                item.risk === 'high' ? 'bg-critical/10 text-critical' : 'bg-warning/10 text-warning'
              }`}>
                {item.risk === 'high' ? 'Alto' : 'Medio'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
