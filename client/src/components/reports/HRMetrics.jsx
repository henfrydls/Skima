import { 
  Users, 
  FileText, 
  UserCheck,
  UserX,
  UserPlus,
  Clock
} from 'lucide-react';

/**
 * HRMetrics — HR/People View
 * 
 * Focus: People-centric development tracking
 * - Talent Distribution (functional)
 * - Individual Development Plans (Phase 3)
 * - Succession Planning (Phase 4)
 */

// Coming Soon Placeholder Component
function ComingSoonSection({ icon: Icon, title, description, phase }) {
  return (
    <div className="bg-surface p-6 rounded-lg border border-dashed border-gray-200">
      <div className="text-center py-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon size={24} className="text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-700 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          <Clock size={12} />
          {phase}
        </span>
      </div>
    </div>
  );
}

export default function HRMetrics({ distribution, collaborators: _collaborators }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Talent Distribution - FUNCTIONAL */}
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

      {/* IDP - COMING SOON (Phase 3) */}
      <ComingSoonSection
        icon={FileText}
        title="Planes de Desarrollo Individual"
        description="Crea y da seguimiento a planes de desarrollo personalizados basados en los gaps identificados."
        phase="Disponible en Fase 3"
      />

      {/* Succession Planning - COMING SOON (Phase 4) */}
      <ComingSoonSection
        icon={UserPlus}
        title="Planificación de Sucesión"
        description="Identifica sucesores potenciales para roles críticos y evalúa su preparación."
        phase="Disponible en Fase 4"
      />
    </div>
  );
}
