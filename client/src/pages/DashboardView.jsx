import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { API_BASE } from '../lib/apiBase';
import { preloadData } from '../lib/dataPreload';
import {
  prioritizeGaps,
  detectUnderutilizedTalent,
  calculateExecutiveMetrics,
  calculateDistributionByCategory
} from '../lib/dashboardLogic';
import { generateTimePeriods, getSnapshotData, getPreviousPeriodDate, findBestMatchingPeriod } from '../lib/timeLogic';
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

  // Intelligent Context Switching
  const handleGranularityChange = (newGranularity) => {
    if (newGranularity === granularity) return;

    // Try to find the best matching period in the new granularity
    // to preserve the user's "temporal context"
    const newSnapshotId = findBestMatchingPeriod(selectedSnapshotId, newGranularity, availableSnapshots);
    
    // Update both states
    setGranularity(newGranularity);
    if (newSnapshotId) {
        setSelectedSnapshotId(newSnapshotId);
    } else {
        // If no match found (e.g. switching to a grain with no data?), 
        // fallback or stay selected? 
        // If we return null, it goes to "Live". 
        // It's safer to go to Live or keep current selection?
        // But current selection ID is of wrong type (e.g. Year ID while in Month grain).
        // This might break dropdown logic if filtered by type.
        // DashboardHeader filters periods by type: periods.filter(p => p.type === granularity)
        // So keeping a Year ID while in Month grain effectively selects "Nothing" (valid).
        // But better to be explicit. Let's default to Live if no match.
        setSelectedSnapshotId(null);
    }
  };

  // Fetch data — uses preloaded promise if available, otherwise fetches fresh
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const preloaded = await preloadData();
        if (preloaded) {
          setData(preloaded);
        } else {
          const response = await fetch(`${API_BASE}/api/data`);
          if (!response.ok) throw new Error('Error fetching data');
          setData(await response.json());
        }
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
  // Previous metrics for comparison (Auto-compare with previous period)
  // Logic: Respects granularity (Month vs Prev Month, Year vs Prev Year)
  // Works for both Live (Now vs Prev) and Time Travel (Snapshot vs Prev)
  const previousMetrics = useMemo(() => {
    let anchorDate;

    if (isComparing) {
        // Snapshot Mode: Anchor is the END date of the selected snapshot
        const currentSnapshot = availableSnapshots.find(s => s.id === selectedSnapshotId);
        if (currentSnapshot) {
           anchorDate = new Date(currentSnapshot.endDate);
        }
    } else {
        // Live Mode: Anchor is NOW
        anchorDate = new Date();
    }
    
    if (anchorDate) {
        // Calculate the end date of the PREVIOUS equivalent period
        const compareDate = getPreviousPeriodDate(anchorDate, granularity);
        
        // Reconstruct state at that previous point
        const prevCollaborators = getSnapshotData(collaborators, compareDate);
        return calculateExecutiveMetrics(prevCollaborators, skills, categories, isCriticalGap, roleProfiles);
    }
    return null;
  }, [isComparing, selectedSnapshotId, availableSnapshots, collaborators, skills, categories, roleProfiles, granularity]);

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
    <div className="flex-1 flex flex-col bg-gray-50 -m-6 p-6 space-y-6">
      {/* Header with Time Travel */}
      <DashboardHeader
        periods={availableSnapshots}
        selectedPeriod={selectedSnapshotId}
        onPeriodChange={setSelectedSnapshotId}
        granularity={granularity}
        onGranularityChange={handleGranularityChange}
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
