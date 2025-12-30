import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  TrendingUp, 
  TrendingDown,
  BookOpen,
  Calendar,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { prioritizeGaps, calculateDistribution } from '../lib/dashboardLogic';
import SnapshotSelector from '../components/dashboard/SnapshotSelector';
import { 
  StakeholderToggle, 
  ManagerMetrics, 
  DirectorMetrics, 
  HRMetrics 
} from '../components/reports';

// Helper: isCriticalGap - Brecha crítica = skill con criticidad 'C' y nivel < 3
const isCriticalGap = (skillData) => {
  if (!skillData) return false;
  return skillData.criticidad === 'C' && skillData.nivel < 3;
};

/**
 * ReportsPage - Analytics y Exportación
 * 
 * Phase 3: Stakeholder Views
 * - Toggle between Manager, Director, and HR perspectives
 * - Each role sees metrics tailored to their decision-making needs
 */

// ============================================
// EXPORT BUTTON WITH STATES
// ============================================
function ExportButton({ icon: IconComponent, title, description, format, onExport, disabled = false }) {
  const [state, setState] = useState('idle'); // idle | loading | success

  const handleClick = async () => {
    if (disabled || state !== 'idle') return;
    
    setState('loading');
    
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onExport(format);
    setState('success');
    
    // Reset to idle after 2 seconds
    setTimeout(() => setState('idle'), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state !== 'idle'}
      className={`
        p-5 bg-surface rounded-lg border text-left transition-colors
        ${state === 'success' 
          ? 'border-competent/30 bg-competent/5' 
          : disabled 
            ? 'border-gray-100 opacity-60 cursor-not-allowed' 
            : 'border-gray-200 hover:border-primary/30'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center transition-colors
          ${state === 'loading' ? 'bg-gray-100 text-gray-400' :
            state === 'success' ? 'bg-competent/10 text-competent' :
            disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-primary'}
        `}>
          {state === 'loading' ? (
            <Loader2 size={24} className="animate-spin" />
          ) : state === 'success' ? (
            <Check size={24} />
          ) : (
            <IconComponent size={24} />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-medium transition-colors ${
            state === 'success' ? 'text-competent' : 'text-gray-800'
          }`}>
            {state === 'loading' ? 'Generando...' :
             state === 'success' ? 'Exportado ✓' : title}
          </h3>
          {state === 'idle' && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {disabled && state === 'idle' && (
            <span className="text-xs text-gray-400 mt-2 block">Próximamente</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================
// GAP ANALYSIS SECTION - Clean Design
// ============================================
function GapAnalysisSection({ gaps }) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-lg border border-gray-100 text-center">
        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No hay gaps críticos identificados</p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Categorías con Mayor Impacto
      </h3>
      
      <div className="space-y-3">
        {gaps.slice(0, 5).map((gap, index) => (
          <div 
            key={gap.id}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
              ${gap.severidad === 'critical' ? 'bg-critical/20 text-critical' : 
                gap.severidad === 'warning' ? 'bg-warning/20 text-warning' : 'bg-gray-200 text-gray-600'}
            `}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800">{gap.categoria}</h4>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs text-gray-600">
                  {gap.afectados} {gap.afectados === 1 ? 'persona' : 'personas'}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {gap.skillsAfectados} skills con gap
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button 
        className="w-full mt-6 p-4 border border-dashed border-gray-300 rounded-lg text-center group hover:border-primary transition-colors"
        onClick={() => alert('Próximamente: Exportar Plan de Capacitación')}
      >
        <Download size={18} className="mx-auto text-gray-400 group-hover:text-primary mb-2" />
        <span className="text-sm text-gray-600 group-hover:text-primary">
          Exportar Plan de Capacitación
        </span>
      </button>
    </div>
  );
}

// ============================================
// TREND ANALYSIS SECTION
// ============================================
function TrendAnalysisSection() {
  const trendData = {
    hasSnapshots: true,
    trends: [
      { skill: 'Backend Development', delta: 1.2, direction: 'up' },
      { skill: 'Liderazgo del Cambio', delta: 0.8, direction: 'up' },
      { skill: 'Cloud & DevOps', delta: -0.3, direction: 'down' },
    ]
  };

  if (!trendData.hasSnapshots) {
    return (
      <div className="bg-surface p-6 rounded-lg border border-gray-100 text-center">
        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
        <h4 className="font-medium text-gray-700 mb-2">Análisis de Tendencias</h4>
        <p className="text-sm text-gray-500 mb-4">
          Crea snapshots para ver la evolución del equipo.
        </p>
        <button className="text-sm text-primary hover:underline">
          Crear primer snapshot →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Evolución del Equipo
      </h3>

      <div className="space-y-2">
        {trendData.trends.map((trend) => (
          <div 
            key={trend.skill}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-sm text-gray-700">{trend.skill}</span>
            <span className={`
              flex items-center gap-1 text-sm font-medium
              ${trend.direction === 'up' ? 'text-competent' : 'text-warning'}
            `}>
              {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
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
// TEAM SUMMARY SECTION - Neutral Backgrounds
// ============================================
function TeamSummarySection({ distribution }) {
  return (
    <div className="bg-surface p-6 rounded-lg border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Resumen del Equipo
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-light text-critical">{distribution.needsAttention}</p>
          <p className="text-xs text-gray-600 mt-1">Requieren Atención</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-light text-warning">{distribution.developing}</p>
          <p className="text-xs text-gray-600 mt-1">En Desarrollo</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
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
  // Stakeholder role state
  const [stakeholderRole, setStakeholderRole] = useState('manager');
  
  // Data state
  const [data, setData] = useState({ categories: [], skills: [], collaborators: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Error fetching data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error loading reports data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const { categories, skills, collaborators } = data;

  // Calculate gaps (category-level data from prioritizeGaps)
  const gaps = useMemo(() => {
    if (!collaborators.length) return [];
    return prioritizeGaps(collaborators, skills, categories, isCriticalGap);
  }, [collaborators, skills, categories]);

  // Calculate distribution
  const distribution = useMemo(() => {
    if (!collaborators.length) return { needsAttention: 0, developing: 0, proficient: 0 };
    return calculateDistribution(collaborators);
  }, [collaborators]);

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

  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skills-matrix-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exportando datos');
    }
  };

  const handleExportCSV = () => {
    let csv = 'Nombre,Rol,Promedio,Gaps Críticos\n';
    
    collaborators.forEach(collab => {
      const skillValues = Object.values(collab.skills).map(s => s.nivel);
      const promedio = skillValues.length > 0 
        ? skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length 
        : 0;
      const criticalGaps = Object.values(collab.skills)
        .filter(skillData => isCriticalGap(skillData))
        .length;
      
      csv += `"${collab.nombre}","${collab.rol}",${promedio.toFixed(1)},${criticalGaps}\n`;
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

      {/* Snapshot Context */}
      <SnapshotSelector />

      {/* Quick Export Section */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Exportación Rápida
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ExportButton
            icon={FileText}
            title="Reporte Ejecutivo PDF"
            description="Resumen para stakeholders"
            format="pdf"
            onExport={handleExport}
            disabled={true}
          />
          <ExportButton
            icon={FileSpreadsheet}
            title="Matriz Excel"
            description="Datos completos con fórmulas"
            format="excel"
            onExport={handleExport}
          />
          <ExportButton
            icon={Download}
            title="Exportar CSV"
            description="Data para análisis personalizado"
            format="csv"
            onExport={handleExport}
          />
          <ExportButton
            icon={FileJson}
            title="Backup JSON"
            description="Backup completo del sistema"
            format="json"
            onExport={handleExport}
          />
        </div>
      </section>

      {/* Stakeholder Toggle */}
      <section>
        <StakeholderToggle 
          activeRole={stakeholderRole} 
          onChange={setStakeholderRole} 
        />
      </section>

      {/* Role-Specific Metrics */}
      {stakeholderRole === 'manager' && (
        <ManagerMetrics gaps={gaps} distribution={distribution} />
      )}
      
      {stakeholderRole === 'director' && (
        <DirectorMetrics gaps={gaps} distribution={distribution} categories={categories} />
      )}
      
      {stakeholderRole === 'hr' && (
        <HRMetrics distribution={distribution} collaborators={collaborators} />
      )}
    </div>
  );
}

