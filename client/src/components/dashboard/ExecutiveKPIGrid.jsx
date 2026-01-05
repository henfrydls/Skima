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
        title="Índice de Madurez"
        value={metrics.teamAverageRaw}
        previousValue={previousMetrics?.teamAverageRaw}
        subtext="Promedio general del equipo"
        icon={TrendingUp}
        color="indigo"
        sparklineData={sparklineData.maturity}
      />

      {/* 2. Riesgo de Talento - Critical Gaps */}
      <StatCard
        title="Riesgo de Talento"
        value={metrics.criticalGaps}
        previousValue={previousMetrics?.criticalGaps}
        subtext="Brechas críticas activas"
        icon={AlertTriangle}
        color="rose"
        invertDelta={true} // Lower is better
        suffix=""
      />

      {/* 3. Densidad de Expertos */}
      <StatCard
        title="Densidad de Expertos"
        value={metrics.expertDensity || 0}
        previousValue={previousMetrics?.expertDensity}
        subtext="% skills en nivel 4-5"
        icon={Star}
        color="emerald"
        suffix="%"
      />

      {/* 4. Cobertura de Roles */}
      <StatCard
        title="Cobertura de Roles"
        value={metrics.roleCoverage || 0}
        previousValue={previousMetrics?.roleCoverage}
        subtext="% cumpliendo requisitos mínimos"
        icon={Shield}
        color="indigo"
        suffix="%"
      />
    </div>
  );
}

