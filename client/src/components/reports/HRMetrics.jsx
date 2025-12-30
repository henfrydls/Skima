import { 
  Users, 
  FileText, 
  AlertTriangle,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react';

/**
 * HRMetrics — HR/People View
 * 
 * Focus: People-centric development tracking
 * - Talent Distribution
 * - Individual Development Plans (IDPs)
 * - Succession Planning
 */

export default function HRMetrics({ distribution, collaborators }) {
  // Mock IDP data
  const idpStatus = [
    { 
      name: 'María González', 
      role: 'Product Manager',
      average: 3.2,
      hasIDP: true,
      objectives: 2,
      nextReview: '15 Ene 2025'
    },
    { 
      name: 'Carlos Rodríguez', 
      role: 'Tech Lead',
      average: 3.6,
      hasIDP: true,
      objectives: 3,
      nextReview: '20 Ene 2025'
    },
    { 
      name: 'Laura Torres', 
      role: 'Jr Developer',
      average: 2.1,
      hasIDP: false,
      objectives: 0,
      gaps: 15
    },
  ];

  const succession = [
    { 
      role: 'Arquitecto Cloud',
      current: 'Carlos Rodríguez',
      backup: null,
      risk: 'high'
    },
    { 
      role: 'Product Manager',
      current: 'María González',
      backup: 'Pedro Sánchez',
      risk: 'low'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Talent Distribution */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Users size={16} className="text-primary" />
          Distribución de Talento
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-competent/10 flex items-center justify-center">
              <UserCheck size={24} className="text-competent" />
            </div>
            <p className="text-2xl font-light text-competent">{distribution?.proficient || 2}</p>
            <p className="text-xs text-gray-600 mt-1">High Performers</p>
            <p className="text-xs text-gray-400">&gt; 3.5 promedio</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-warning/10 flex items-center justify-center">
              <Users size={24} className="text-warning" />
            </div>
            <p className="text-2xl font-light text-warning">{distribution?.developing || 2}</p>
            <p className="text-xs text-gray-600 mt-1">Solid Contributors</p>
            <p className="text-xs text-gray-400">2.5 - 3.5</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-critical/10 flex items-center justify-center">
              <UserX size={24} className="text-critical" />
            </div>
            <p className="text-2xl font-light text-critical">{distribution?.needsAttention || 1}</p>
            <p className="text-xs text-gray-600 mt-1">Needs Development</p>
            <p className="text-xs text-gray-400">&lt; 2.5</p>
          </div>
        </div>
      </div>

      {/* IDP Status */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          Estado de Desarrollo Individual
        </h3>
        
        <div className="space-y-3">
          {idpStatus.map((person) => (
            <div key={person.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                  {person.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.role} • Promedio: {person.average}</p>
                </div>
              </div>
              <div className="text-right">
                {person.hasIDP ? (
                  <>
                    <span className="text-xs text-competent">
                      {person.objectives} objetivos activos
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      Próxima revisión: {person.nextReview}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-critical flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Sin IDP • {person.gaps} gaps
                    </span>
                    <button className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition-colors">
                      Crear IDP
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Succession Planning */}
      <div className="bg-surface p-6 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <UserPlus size={16} className="text-warning" />
          Planificación de Sucesión
        </h3>
        
        <div className="space-y-3">
          {succession.map((item) => (
            <div key={item.role} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.role}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Actual: {item.current}
                  </p>
                </div>
                <div className="text-right">
                  {item.backup ? (
                    <span className="text-xs text-competent">
                      Backup: {item.backup}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-critical flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Sin backup
                      </span>
                      <button className="text-xs text-primary hover:underline">
                        Identificar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
