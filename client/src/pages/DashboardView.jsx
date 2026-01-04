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
import { generateTimePeriods, getSnapshotData } from '../lib/timeLogic';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveKPIGrid from '../components/dashboard/ExecutiveKPIGrid';
import StrategicInsights from '../components/dashboard/StrategicInsights';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';

// Helper: isCriticalGap - Brecha crítica = skill con criticidad 'C' y nivel < 3
const isCriticalGap = (skillData) => {
  if (!skillData) return false;
  return skillData.criticidad === 'C' && skillData.nivel < 3;
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
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const [granularity, setGranularity] = useState('quarter'); // Default granularity

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

  // 1. Generate Available Time Periods (Virtual Snapshots)
  const availableSnapshots = useMemo(() => {
    return generateTimePeriods(collaborators);
  }, [collaborators]);

  // 2. Derive Current State (Live or Reconstructed)
  const currentData = useMemo(() => {
    if (!selectedSnapshotId) return collaborators; // Live View
    
    const snapshot = availableSnapshots.find(s => s.id === selectedSnapshotId);
    if (!snapshot) return collaborators; // Fallback
    
    // Virtual Snapshot: Reconstruct state at that date
    return getSnapshotData(collaborators, snapshot.endDate);
  }, [collaborators, selectedSnapshotId, availableSnapshots]);

  const isComparing = selectedSnapshotId !== null;

  // Calcular métricas ejecutivas
  const metrics = useMemo(() => {
    if (!currentData.length) {
      return { 
        teamAverage: '0.0', 
        teamAverageRaw: 0, 
        criticalGaps: 0, 
        teamSize: 0,
        expertDensity: 0,
        roleCoverage: 0
      };
    }
    return calculateExecutiveMetrics(currentData, skills, categories, isCriticalGap, roleProfiles);
  }, [currentData, skills, categories, roleProfiles]);

  // Previous metrics for comparison (Auto-compare with previous period)
  // Logic: If looking at Q4, compare with Q3. If Live, compare with last Q.
  const previousMetrics = useMemo(() => {
    // Advanced: could implement getSnapshotData for "previous period"
    // For now, let's keep it simple or implement the previous period logic if needed.
    // Let's implement a basic "Compare with previous month" logic for live, 
    // or "Compare with previous period" for snapshots.
    
    let compareDate;
    if (isComparing) {
      const currentSnapshot = availableSnapshots.find(s => s.id === selectedSnapshotId);
      if (currentSnapshot) {
         // Find immediate previous period of same type
         // (Assuming periods are sorted new->old in generateTimePeriods?)
         // Actually generateTimePeriods returns them unsorted or sorted? 
         // Let's assume we find the one chronologically before.
         // Simpler: Just subtract 1 unit from endDate.
         compareDate = new Date(currentSnapshot.startDate);
         compareDate.setDate(compareDate.getDate() - 1); 
      }
    } else {
      // Live: Compare with last month
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      compareDate = d;
    }
    
    if (compareDate) {
        const prevCollaborators = getSnapshotData(collaborators, compareDate);
        return calculateExecutiveMetrics(prevCollaborators, skills, categories, isCriticalGap, roleProfiles);
    }
    return null;
  }, [isComparing, selectedSnapshotId, availableSnapshots, collaborators, skills, categories, roleProfiles]);

  // Distribución por categoría para gráfico apilado
  const distributionByCategory = useMemo(() => {
    if (!currentData.length) return [];
    return calculateDistributionByCategory(currentData, skills, categories);
  }, [currentData, skills, categories]);

  // Gaps priorizados (para lista de riesgos)
  const prioritizedGaps = useMemo(() => {
    if (!currentData.length) return [];
    return prioritizeGaps(currentData, skills, categories, isCriticalGap);
  }, [currentData, skills, categories]);

  // Insights automáticos
  const insights = useMemo(() => {
    if (!currentData.length) return [];
    return detectUnderutilizedTalent(currentData, skills);
  }, [currentData, skills]);

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6 space-y-6">
      {/* Header with Time Travel */}
      <DashboardHeader
        periods={availableSnapshots}
        selectedPeriod={selectedSnapshotId}
        onPeriodChange={setSelectedSnapshotId}
        granularity={granularity}
        onGranularityChange={setGranularity}
      />

      {/* KPI Grid */}
      <ExecutiveKPIGrid 
        metrics={metrics} 
        previousMetrics={previousMetrics}
      />

      {/* Strategic Insights + Automatic Insight */}
      <StrategicInsights
        distributionByCategory={distributionByCategory}
        operationalRisks={prioritizedGaps}
        automaticInsight={insights.length > 0 ? insights[0] : null}
      />

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
