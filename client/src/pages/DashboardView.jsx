import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Camera, 
  Download,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { 
  COLLABORATORS, 
  SKILLS, 
  CATEGORIES, 
  isCriticalGap,
  calculateMetrics 
} from '../data/mockData';
import {
  calculateDelta,
  prioritizeGaps,
  calculateDistribution,
  detectUnderutilizedTalent,
  calculateExecutiveMetrics
} from '../lib/dashboardLogic';
import SnapshotSelector from '../components/dashboard/SnapshotSelector';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';

// ============================================
// MOCK SNAPSHOT DATA (para Time Travel)
// ============================================
const MOCK_PREVIOUS_SNAPSHOT = {
  promedioGeneral: 2.5,
  fecha: 'Junio 2024'
};

// ============================================
// DASHBOARD VIEW - Executive Summary
// ============================================
export default function DashboardView() {
  // Loading state - Para demostrar skeleton durante fetch futuro
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos (reemplazar con fetch real al backend)
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Calcular métricas ejecutivas
  const metrics = useMemo(() => {
    return calculateExecutiveMetrics(COLLABORATORS, SKILLS, CATEGORIES, isCriticalGap);
  }, []);

  // Calcular delta vs snapshot anterior
  const trendData = useMemo(() => {
    return calculateDelta(metrics.teamAverageRaw, MOCK_PREVIOUS_SNAPSHOT.promedioGeneral);
  }, [metrics]);

  // Gaps priorizados
  const prioritizedGaps = useMemo(() => {
    return prioritizeGaps(COLLABORATORS, SKILLS, CATEGORIES, isCriticalGap);
  }, []);

  // Distribución del equipo
  const distribution = useMemo(() => {
    return calculateDistribution(COLLABORATORS);
  }, []);

  // Insights automáticos
  const insights = useMemo(() => {
    return detectUnderutilizedTalent(COLLABORATORS, SKILLS);
  }, []);

  // Calcular progreso hacia objetivo
  const targetScore = 3.5;
  const progressPercent = Math.min((metrics.teamAverageRaw / targetScore) * 100, 100);

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1>Dashboard Ejecutivo</h1>
        <p className="text-gray-500 mt-1">
          Resumen del estado de competencias del equipo
        </p>
      </div>

      {/* Snapshot Selector - Time Travel Feature */}
      <SnapshotSelector 
        onSnapshotChange={(snapshot) => console.log('Current:', snapshot)}
        onCompareChange={(snapshot) => console.log('Compare:', snapshot)}
        onCreateSnapshot={() => console.log('Create snapshot requested')}
      />

      {/* Hero: Health Score */}
      <div className="bg-surface p-8 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main KPI */}
          <div className="text-center lg:text-left">
            <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Promedio General del Equipo
            </p>
            <div className="flex items-baseline justify-center lg:justify-start gap-4">
              <p className="text-7xl font-light text-primary">
                {metrics.teamAverage}
              </p>
              <div className="flex flex-col items-start">
                <span className={`text-lg font-medium flex items-center gap-1 ${
                  trendData.trend === 'up' ? 'text-competent' : 
                  trendData.trend === 'down' ? 'text-warning' : 'text-gray-500'
                }`}>
                  {trendData.trend === 'up' ? <TrendingUp size={20} /> : 
                   trendData.trend === 'down' ? <TrendingDown size={20} /> : null}
                  {trendData.deltaRaw > 0 ? '+' : ''}{trendData.delta}
                </span>
                <span className="text-xs text-gray-400">vs {MOCK_PREVIOUS_SNAPSHOT.fecha}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Actual: {metrics.teamAverage}</span>
                <span>Objetivo: {targetScore}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-2 bg-primary rounded-full transition-all animate-progress"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-critical/5 rounded-lg border border-critical/20">
              <p className="text-3xl font-light text-critical">{metrics.criticalGaps}</p>
              <p className="text-xs text-gray-600 mt-1">Brechas Críticas</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-3xl font-light text-primary">{metrics.teamSize}</p>
              <p className="text-xs text-gray-600 mt-1">Colaboradores</p>
            </div>
            <div className="text-center p-4 bg-competent/5 rounded-lg border border-competent/20">
              <p className="text-3xl font-light text-competent">{metrics.strengths}</p>
              <p className="text-xs text-gray-600 mt-1">Fortalezas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution + Top Gaps */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team Distribution */}
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
            <Users size={20} />
            Distribución del Equipo
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <p className="text-3xl font-light text-warning">{distribution.beginners.count}</p>
              <p className="text-sm text-gray-600 mt-1">Principiantes</p>
              <p className="text-xs text-gray-400">&lt; 2.5</p>
            </div>
            <div className="text-center p-4 bg-competent/10 rounded-lg">
              <p className="text-3xl font-light text-competent">{distribution.competent.count}</p>
              <p className="text-sm text-gray-600 mt-1">Competentes</p>
              <p className="text-xs text-gray-400">2.5 - 3.5</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-light text-primary">{distribution.experts.count}</p>
              <p className="text-sm text-gray-600 mt-1">Expertos</p>
              <p className="text-xs text-gray-400">&gt; 3.5</p>
            </div>
          </div>
          <Link 
            to="/team-matrix" 
            className="mt-4 text-sm text-primary hover:underline flex items-center gap-1 justify-center"
          >
            Ver matriz completa <ArrowRight size={14} />
          </Link>
        </div>

        {/* Priority Gaps */}
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Áreas de Atención
          </h3>
          
          {prioritizedGaps.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              ¡Excelente! No hay brechas críticas.
            </p>
          ) : (
            <div className="space-y-3">
              {prioritizedGaps.slice(0, 3).map((gap, idx) => (
                <div 
                  key={gap.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                    gap.severidad === 'critical' ? 'border-critical bg-critical/5' :
                    gap.severidad === 'warning' ? 'border-warning bg-warning/5' :
                    'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    gap.severidad === 'critical' ? 'bg-critical text-white' :
                    gap.severidad === 'warning' ? 'bg-warning text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">{gap.categoria}</h4>
                    <p className="text-sm text-gray-600">
                      {gap.afectados} colaborador{gap.afectados > 1 ? 'es' : ''} afectado{gap.afectados > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link 
                    to="/team-matrix"
                    className="text-xs text-primary hover:underline flex-shrink-0"
                  >
                    Ver →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insight Automático */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-competent/5 p-6 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-primary flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                💡 Insight Automático
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>{insights[0].colaborador}</strong> tiene alto nivel en{' '}
                <strong>{insights[0].skill}</strong> ({insights[0].nivel.toFixed(1)}),
                pero esa skill tiene <span className="text-warning">baja criticidad</span>.
                {' '}Considera reasignarle a áreas donde el equipo tiene gaps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Acciones Rápidas
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Crear Snapshot - Coming Soon */}
          <button 
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg opacity-60 cursor-not-allowed text-center relative"
            disabled
            title="Próximamente"
          >
            <Camera className="mx-auto mb-2 text-gray-300" size={24} />
            <p className="text-sm font-medium text-gray-400">Crear Snapshot</p>
            <span className="text-[10px] text-gray-400 mt-1 block">Próximamente</span>
          </button>

          {/* Ver Matriz - Functional */}
          <Link 
            to="/team-matrix"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center group hover-lift"
          >
            <Users className="mx-auto mb-2 text-gray-400 group-hover:text-primary transition-colors" size={24} />
            <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800">Ver Matriz</p>
          </Link>

          {/* Evaluar - Coming Soon */}
          <button 
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg opacity-60 cursor-not-allowed text-center"
            disabled
            title="Próximamente"
          >
            <TrendingUp className="mx-auto mb-2 text-gray-300" size={24} />
            <p className="text-sm font-medium text-gray-400">Evaluar</p>
            <span className="text-[10px] text-gray-400 mt-1 block">Próximamente</span>
          </button>

          {/* Exportar - Coming Soon */}
          <button 
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg opacity-60 cursor-not-allowed text-center"
            disabled
            title="Próximamente"
          >
            <Download className="mx-auto mb-2 text-gray-300" size={24} />
            <p className="text-sm font-medium text-gray-400">Exportar</p>
            <span className="text-[10px] text-gray-400 mt-1 block">Próximamente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
