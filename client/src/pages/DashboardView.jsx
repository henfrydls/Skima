import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import {
  calculateDelta,
  prioritizeGaps,
  calculateDistribution,
  detectUnderutilizedTalent,
  calculateExecutiveMetrics,
  calculateDistributionByCategory
} from '../lib/dashboardLogic';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveKPIGrid from '../components/dashboard/ExecutiveKPIGrid';
import StrategicInsights from '../components/dashboard/StrategicInsights';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';

// Helper: isCriticalGap - Brecha crítica = skill con criticidad 'C' y nivel < 3
const isCriticalGap = (skillData) => {
  if (!skillData) return false;
  return skillData.criticidad === 'C' && skillData.nivel < 3;
};

// Mock snapshots for Time Travel (Phase 3 will replace with real data)
const MOCK_SNAPSHOTS = [
  { id: 1, label: 'Diciembre 2025', date: '2025-12-01' },
  { id: 2, label: 'Septiembre 2025', date: '2025-09-01' },
  { id: 3, label: 'Junio 2025', date: '2025-06-01' },
];

// Mock previous metrics for comparison demo
const MOCK_PREVIOUS_METRICS = {
  teamAverageRaw: 2.5,
  criticalGaps: 18,
  expertDensity: 15,
  roleCoverage: 45,
};

// ============================================
// DASHBOARD VIEW - Executive Summary (Redesigned)
// ============================================
export default function DashboardView() {
  // Data state
  const [data, setData] = useState({ categories: [], skills: [], collaborators: [], roleProfiles: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Time Travel state
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const isComparing = selectedSnapshot !== null;

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
        setError('Error cargando datos del dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const { categories, skills, collaborators, roleProfiles = {} } = data;

  // Calcular métricas ejecutivas
  const metrics = useMemo(() => {
    if (!collaborators.length) {
      return { 
        teamAverage: '0.0', 
        teamAverageRaw: 0, 
        criticalGaps: 0, 
        teamSize: 0,
        expertDensity: 0,
        roleCoverage: 0
      };
    }
    return calculateExecutiveMetrics(collaborators, skills, categories, isCriticalGap, roleProfiles);
  }, [collaborators, skills, categories, roleProfiles]);

  // Previous metrics for comparison (mock for now)
  const previousMetrics = useMemo(() => {
    if (!isComparing) return null;
    return MOCK_PREVIOUS_METRICS;
  }, [isComparing]);

  // Distribución por categoría para gráfico apilado
  const distributionByCategory = useMemo(() => {
    if (!collaborators.length) return [];
    return calculateDistributionByCategory(collaborators, skills, categories);
  }, [collaborators, skills, categories]);

  // Gaps priorizados (para lista de riesgos)
  const prioritizedGaps = useMemo(() => {
    if (!collaborators.length) return [];
    return prioritizeGaps(collaborators, skills, categories, isCriticalGap);
  }, [collaborators, skills, categories]);

  // Team distribution
  const distribution = useMemo(() => {
    if (!collaborators.length) return { 
      beginners: { count: 0, names: [] }, 
      competent: { count: 0, names: [] }, 
      experts: { count: 0, names: [] } 
    };
    return calculateDistribution(collaborators);
  }, [collaborators]);

  // Insights automáticos
  const insights = useMemo(() => {
    if (!collaborators.length) return [];
    return detectUnderutilizedTalent(collaborators, skills);
  }, [collaborators, skills]);

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6 space-y-6">
      {/* Header with Time Travel */}
      <DashboardHeader
        snapshots={MOCK_SNAPSHOTS}
        selectedSnapshot={selectedSnapshot}
        onSnapshotSelect={setSelectedSnapshot}
        isComparing={isComparing}
      />

      {/* KPI Grid */}
      <ExecutiveKPIGrid 
        metrics={metrics} 
        previousMetrics={previousMetrics}
      />

      {/* Strategic Insights */}
      <StrategicInsights
        distributionByCategory={distributionByCategory}
        operationalRisks={prioritizedGaps}
      />

      {/* Insight Automático */}
      {insights.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="text-primary" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">
                💡 Insight Automático
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>{insights[0].colaborador}</strong> tiene alto nivel en{' '}
                <strong>{insights[0].skill}</strong> ({insights[0].nivel.toFixed(1)}),
                pero esa skill tiene <span className="text-warning font-medium">baja criticidad</span>.
                {' '}Considera reasignarle a áreas donde el equipo tiene gaps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="flex justify-center">
        <Link 
          to="/team-matrix" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-primary hover:shadow-md transition-all text-gray-600 hover:text-primary"
        >
          Explorar Team Matrix
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
