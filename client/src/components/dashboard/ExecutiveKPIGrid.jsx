import { TrendingUp, AlertTriangle, Star, Shield } from 'lucide-react';
import StatCard from '../common/StatCard';

/**
 * ExecutiveKPIGrid - 4 high-impact KPI cards
 * 
 * Refactored to use generic StatCard component.
 * 
 * 1. Índice de Madurez (General Average)
 * 2. Riesgo de Talento (Critical Gaps)
 * 3. Densidad de Expertos (% level 4-5)
 * 4. Cobertura de Roles (% meeting requirements)
 */

export default function ExecutiveKPIGrid({
  metrics,
  previousMetrics = null,
  sparklineData = {}
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Índice de Madurez - General Average */}
      <StatCard
        title="Maturity Index"
        value={metrics.teamAverageRaw}
        previousValue={previousMetrics?.teamAverageRaw}
        subtext="Team overall average"
        icon={TrendingUp}
        color="primary"
        sparklineData={sparklineData.maturity}
        helpContent="Team overall average based on all evaluations. Scale: < 2.5 Needs Attention · 2.5–3.5 Competent · >= 3.5 Strength. Goal: 4.0"
      />

      {/* 2. Riesgo de Talento - Critical Gaps */}
      <StatCard
        title="Talent Risk"
        value={metrics.criticalGaps}
        previousValue={previousMetrics?.criticalGaps}
        subtext="Active critical gaps"
        icon={AlertTriangle}
        color="rose"
        invertDelta={true} // Lower is better
        suffix=""
        helpContent="Skills marked as Critical (C) where the level is below the competent threshold (< 2.5). Require immediate action."
      />

      {/* 3. Densidad de Expertos */}
      <StatCard
        title="Expert Density"
        value={metrics.expertDensity || 0}
        previousValue={previousMetrics?.expertDensity}
        subtext="% skills at level 4-5"
        icon={Star}
        color="emerald"
        suffix="%"
        helpContent="Percentage of skills evaluated at level 4+. Indicates the proportion of competencies where the team has advanced mastery."
      />

      {/* 4. Cobertura de Roles */}
      <StatCard
        title="Role Coverage"
        value={metrics.roleCoverage || 0}
        previousValue={previousMetrics?.roleCoverage}
        subtext="% meeting minimum requirements"
        icon={Shield}
        color="primary"
        suffix="%"
        helpContent="Percentage of collaborators meeting all critical requirements of their role profile (level >= 2.5 in skills marked C)."
        helpAlign="left"
      />
    </div>
  );
}

