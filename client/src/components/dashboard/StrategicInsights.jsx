import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import { AlertTriangle, ExternalLink, Users } from 'lucide-react';

/**
 * StrategicInsights - Visual storytelling for executives
 * 
 * 1. Talent Distribution by Category (Stacked Bar Chart)
 * 2. Top Operational Risks (Compact list with action)
 */

// Color palette for distribution tiers
const TIER_COLORS = {
  beginners: '#f59e0b', // warning/amber
  competent: '#22c55e', // success/green
  experts: '#0d9488',   // primary/teal
};

// Custom Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
      <p className="font-medium text-gray-800 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Stacked Bar Chart for Talent Distribution
function TalentDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No hay datos de distribución
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <XAxis 
            type="number" 
            domain={[0, 'dataMax']}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
          <Bar 
            dataKey="beginners" 
            name="Principiantes" 
            stackId="a" 
            fill={TIER_COLORS.beginners}
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="competent" 
            name="Competentes" 
            stackId="a" 
            fill={TIER_COLORS.competent}
          />
          <Bar 
            dataKey="experts" 
            name="Expertos" 
            stackId="a" 
            fill={TIER_COLORS.experts}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Risk Item Component
function RiskItem({ risk, index }) {
  const severityStyles = {
    critical: 'border-critical bg-critical/5 text-critical',
    warning: 'border-warning bg-warning/5 text-warning',
    info: 'border-gray-300 bg-gray-50 text-gray-500',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${
      risk.severidad === 'critical' ? 'border-critical bg-critical/5' :
      risk.severidad === 'warning' ? 'border-warning bg-warning/5' :
      'border-gray-300 bg-gray-50'
    }`}>
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        risk.severidad === 'critical' ? 'bg-critical text-white' :
        risk.severidad === 'warning' ? 'bg-warning text-white' :
        'bg-gray-400 text-white'
      }`}>
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-800 truncate">{risk.skillName || risk.categoria}</h4>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Users size={10} />
          {risk.afectados} colaborador{risk.afectados !== 1 ? 'es' : ''} afectado{risk.afectados !== 1 ? 's' : ''}
        </p>
      </div>
      
      <Link 
        to="/team-matrix"
        className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
      >
        Ver <ExternalLink size={10} />
      </Link>
    </div>
  );
}

// Operational Risks List
function OperationalRisksList({ risks = [] }) {
  if (risks.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-3">
          <AlertTriangle className="text-success" size={20} />
        </div>
        <p className="text-sm text-gray-500">¡Excelente! No hay riesgos operativos críticos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {risks.slice(0, 5).map((risk, idx) => (
        <RiskItem key={risk.id || idx} risk={risk} index={idx} />
      ))}
      
      {risks.length > 5 && (
        <Link 
          to="/team-matrix"
          className="block text-center text-sm text-primary hover:underline py-2"
        >
          Ver todos los riesgos ({risks.length})
        </Link>
      )}
    </div>
  );
}

export default function StrategicInsights({ 
  distributionByCategory = [], 
  operationalRisks = [] 
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Talent Distribution Chart - 2/3 width */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
          Distribución de Talento por Área
        </h3>
        <TalentDistributionChart data={distributionByCategory} />
        <p className="text-xs text-gray-400 mt-4 text-center">
          Vista de fortalezas y debilidades por categoría
        </p>
      </div>

      {/* Operational Risks - 1/3 width */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            Top Riesgos Operativos
          </h3>
        </div>
        <OperationalRisksList risks={operationalRisks} />
      </div>
    </div>
  );
}
