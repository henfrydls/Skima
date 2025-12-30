import { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  BookOpen,
  Users,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { 
  COLLABORATORS, 
  SKILLS, 
  CATEGORIES, 
  isCriticalGap 
} from '../data/mockData';
import { prioritizeGaps, calculateDistribution } from '../lib/dashboardLogic';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

/**
 * ReportsPage - Analytics y Exportación
 * 
 * Completa el User Journey: Dashboard → Team Matrix → Reports
 * Permite al manager:
 * - Exportar datos en múltiples formatos
 * - Ver análisis de gaps prioritarios
 * - Generar reportes ejecutivos
 */

// ============================================
// QUICK EXPORT BUTTONS
// ============================================
function QuickExportCard({ icon: Icon, title, description, format, onExport, disabled = false }) {
  return (
    <button
      onClick={() => onExport(format)}
      disabled={disabled}
      className={`
        p-6 bg-surface rounded-lg shadow-sm border border-gray-100 text-left
        transition-all hover-lift group
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/30'}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}
          transition-colors
        `}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {disabled && (
            <span className="text-xs text-gray-400 mt-2 block">Próximamente</span>
          )}
        </div>
        <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

// ============================================
// GAP ANALYSIS SECTION
// ============================================
function GapAnalysisSection({ gaps }) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-sm text-center">
        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No hay gaps críticos identificados</p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle size={20} className="text-warning" />
        Categorías con Mayor Impacto
      </h3>
      
      <div className="space-y-4">
        {gaps.slice(0, 5).map((gap, index) => (
          <div 
            key={gap.id}
            className={`flex items-start gap-4 p-4 bg-gray-50 rounded-lg border-l-4 ${
              gap.severidad === 'critical' ? 'border-critical' : 
              gap.severidad === 'warning' ? 'border-warning' : 'border-gray-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              gap.severidad === 'critical' ? 'bg-critical/20 text-critical' : 
              gap.severidad === 'warning' ? 'bg-warning/20 text-warning' : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{gap.categoria}</h4>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-xs bg-critical/10 text-critical px-2 py-1 rounded">
                  {gap.afectados} {gap.afectados === 1 ? 'persona' : 'personas'} afectadas
                </span>
                <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">
                  {gap.skillsAfectados} skills con gap
                </span>
              </div>
              {gap.colaboradores && gap.colaboradores.length > 0 && (
                <p className="text-xs text-gray-400 mt-2 truncate">
                  {gap.colaboradores.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button 
        className="w-full mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center group hover:border-primary hover:bg-primary/5 transition-all"
        onClick={() => alert('Próximamente: Exportar Plan de Capacitación')}
      >
        <Download size={20} className="mx-auto text-gray-400 group-hover:text-primary mb-2" />
        <span className="text-sm font-medium text-gray-600 group-hover:text-primary">
          Exportar Plan de Capacitación
        </span>
      </button>
    </div>
  );
}

// ============================================
// TREND ANALYSIS SECTION (Requiere Snapshots)
// ============================================
function TrendAnalysisSection() {
  // Mock data para demostración
  const trendData = {
    hasSnapshots: true, // Cambiar a false para ver estado vacío
    trends: [
      { skill: 'Backend Development', delta: 1.2, direction: 'up' },
      { skill: 'Liderazgo del Cambio', delta: 0.8, direction: 'up' },
      { skill: 'Cloud & DevOps', delta: -0.3, direction: 'down' },
    ]
  };

  if (!trendData.hasSnapshots) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-sm text-center">
        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
        <h4 className="font-medium text-gray-700 mb-2">Análisis de Tendencias</h4>
        <p className="text-sm text-gray-500 mb-4">
          Crea snapshots para ver la evolución del equipo a través del tiempo.
        </p>
        <button className="text-sm text-primary hover:underline">
          Crear primer snapshot →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-competent" />
        Evolución del Equipo
      </h3>

      <div className="space-y-3">
        {trendData.trends.map((trend) => (
          <div 
            key={trend.skill}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-medium text-gray-700">{trend.skill}</span>
            <span className={`
              flex items-center gap-1 font-semibold
              ${trend.direction === 'up' ? 'text-competent' : 'text-warning'}
            `}>
              {trend.direction === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Comparando: Diciembre 2024 vs Junio 2024
      </p>
    </div>
  );
}

// ============================================
// TEAM SUMMARY SECTION
// ============================================
function TeamSummarySection({ distribution }) {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
        <Users size={20} className="text-primary" />
        Resumen del Equipo
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-critical/10 rounded-lg">
          <p className="text-2xl font-light text-critical">{distribution.needsAttention}</p>
          <p className="text-xs text-gray-600 mt-1">Requieren Atención</p>
        </div>
        <div className="text-center p-4 bg-warning/10 rounded-lg">
          <p className="text-2xl font-light text-warning">{distribution.developing}</p>
          <p className="text-xs text-gray-600 mt-1">En Desarrollo</p>
        </div>
        <div className="text-center p-4 bg-competent/10 rounded-lg">
          <p className="text-2xl font-light text-competent">{distribution.proficient}</p>
          <p className="text-xs text-gray-600 mt-1">Competentes</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN REPORTS PAGE
// ============================================
export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Calculate gaps (category-level data from prioritizeGaps)
  const gaps = useMemo(() => {
    return prioritizeGaps(COLLABORATORS, SKILLS, CATEGORIES, isCriticalGap);
  }, []);

  // Calculate distribution
  const distribution = useMemo(() => {
    return calculateDistribution(COLLABORATORS);
  }, []);

  // Export handlers
  const handleExport = (format) => {
    switch (format) {
      case 'pdf':
        alert('Próximamente: Exportar a PDF');
        break;
      case 'excel':
        handleExportExcel();
        break;
      case 'csv':
        handleExportCSV();
        break;
      case 'json':
        handleExportJSON();
        break;
      default:
        console.log('Unknown format:', format);
    }
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      collaborators: COLLABORATORS,
      skills: SKILLS,
      categories: CATEGORIES
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skills-matrix-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Create CSV with collaborator summaries
    let csv = 'Nombre,Rol,Promedio,Gaps Críticos\n';
    
    COLLABORATORS.forEach(collab => {
      const criticalGaps = Object.entries(collab.skills)
        .filter(([_, skillData]) => isCriticalGap(skillData))
        .length;
      
      csv += `"${collab.nombre}","${collab.rol}",${collab.promedio.toFixed(1)},${criticalGaps}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skills-matrix-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // For now, export as CSV which Excel can open
    // In production, use a library like xlsx
    alert('Exportando como CSV (compatible con Excel)...');
    handleExportCSV();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1>Reportes y Análisis</h1>
        <p className="text-gray-500 mt-1">
          Exporta datos, analiza gaps y genera reportes ejecutivos
        </p>
      </div>

      {/* Quick Export Section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          📊 Exportación Rápida
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <QuickExportCard
            icon={FileText}
            title="Reporte Ejecutivo PDF"
            description="Resumen para presentar a stakeholders"
            format="pdf"
            onExport={handleExport}
            disabled={true}
          />
          <QuickExportCard
            icon={FileSpreadsheet}
            title="Matriz Excel"
            description="Datos completos con fórmulas"
            format="excel"
            onExport={handleExport}
          />
          <QuickExportCard
            icon={Download}
            title="Exportar CSV"
            description="Data cruda para análisis personalizado"
            format="csv"
            onExport={handleExport}
          />
          <QuickExportCard
            icon={FileJson}
            title="Backup JSON"
            description="Backup completo del sistema"
            format="json"
            onExport={handleExport}
          />
        </div>
      </section>

      {/* Analysis Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gap Analysis */}
        <GapAnalysisSection gaps={gaps} />

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Summary */}
          <TeamSummarySection distribution={distribution} />

          {/* Trend Analysis */}
          <TrendAnalysisSection />
        </div>
      </div>

      {/* Training Recommendations (Coming Soon) */}
      <section className="bg-surface p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
        <div className="text-center py-8">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Recomendaciones de Capacitación
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Próximamente: Sugerencias automáticas de cursos basadas en los gaps críticos del equipo.
          </p>
        </div>
      </section>
    </div>
  );
}
