import { Users, AlertTriangle, Activity, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common';
import { calculateMetrics, getTopMissingSkills, COLLABORATORS } from '../data/mockData';


/**
 * DashboardView Page
 * 
 * Vista principal con KPIs y resumen de brechas.
 */
export default function DashboardView() {
  const metrics = calculateMetrics();
  const topMissingSkills = getTopMissingSkills();
  const totalEmployees = COLLABORATORS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de habilidades del equipo</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Empleados */}
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Empleados</p>
            <p className="text-2xl font-semibold text-primary">
              {metrics.totalEmployees}
            </p>
          </div>
        </Card>

        {/* Brechas Críticas */}
        <Card status="error" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-critical/10">
            <AlertTriangle className="w-6 h-6 text-critical" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Brechas Críticas</p>
            <p className="text-2xl font-semibold text-critical">
              {metrics.criticalGaps}
            </p>
          </div>
        </Card>

        {/* Promedio de Nivel */}
        <Card status="success" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-competent/10">
            <Activity className="w-6 h-6 text-competent" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Promedio de Nivel</p>
            <p className="text-2xl font-semibold text-competent">
              {metrics.averageLevel}
            </p>
          </div>
        </Card>
      </div>

      {/* Top Skills Faltantes - Grid de 2 columnas */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-warning" />
            <h2 className="text-lg">Top Skills Faltantes</h2>
          </div>
          <span className="text-xs text-gray-400">
            Empleados con nivel &lt; 3
          </span>
        </div>

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topMissingSkills.map(skill => (
            <div 
              key={skill.id}
              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Header de skill */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary truncate">
                      {skill.name}
                    </span>
                    {skill.criticality === 'Critical' && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium bg-critical/10 text-critical rounded">
                        Crítica
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{skill.category}</span>
                </div>
                <span className="flex-shrink-0 text-sm font-medium text-gray-600 ml-2">
                  {skill.employeesWithGap}/{totalEmployees}
                </span>
              </div>
              
              {/* Barra de progreso más delgada */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    skill.criticality === 'Critical' 
                      ? 'bg-critical' 
                      : skill.gapPercentage > 50 
                        ? 'bg-warning' 
                        : 'bg-competent'
                  }`}
                  style={{ width: `${skill.gapPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/team-matrix">
          <Card className="hover:shadow-md transition-all hover:border-primary/20 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-1">Ver Matriz Completa</h3>
                <p className="text-sm text-gray-500">
                  Explora las habilidades de todo el equipo
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        </Link>

        <Card className="hover:shadow-md transition-all cursor-pointer group opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1">Agregar Evaluación</h3>
              <p className="text-sm text-gray-500">
                Próximamente
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </div>
        </Card>
      </div>
    </div>
  );
}

