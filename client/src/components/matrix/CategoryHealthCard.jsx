import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Users } from 'lucide-react';

/**
 * CategoryHealthCard - Shows category with talent distribution bar
 * 
 * Replaces simple average with a segmented distribution bar:
 * [ Rojo 20% | Amarillo 50% | Verde 30% ]
 * 
 * For Manager: "Do I have enough experts for the new project?"
 * For HR: "Where should I invest training budget?"
 */

// Calculate distribution percentages from real data
// Counts collaborators based on their average level in this category
const calculateDistribution = (collaborators, skills, categoryId, roleProfiles) => {
  let beginners = 0;  // < 2.5
  let competent = 0;  // 2.5 - 3.5
  let experts = 0;    // > 3.5
  let total = 0;

  const categorySkillIds = skills
    .filter(s => s.categoria === categoryId)
    .map(s => s.id);

  if (categorySkillIds.length === 0) {
    return { beginners: 0, competent: 0, experts: 0, total: 0, pctBeginners: 0, pctCompetent: 0, pctExperts: 0 };
  }

  collaborators.forEach(col => {
    // Get all skills this collaborator has in this category
    const levels = categorySkillIds
      .filter(id => col.skills[id] && col.skills[id].nivel > 0)
      .map(id => col.skills[id].nivel);

    // Only count collaborator if they have at least one evaluated skill in this category
    if (levels.length === 0) return;

    const avg = levels.reduce((sum, l) => sum + l, 0) / levels.length;
    total++;

    if (avg >= 3.5) experts++;
    else if (avg >= 2.5) competent++;
    else beginners++;
  });

  return {
    beginners,
    competent,
    experts,
    total,
    pctBeginners: total > 0 ? Math.round((beginners / total) * 100) : 0,
    pctCompetent: total > 0 ? Math.round((competent / total) * 100) : 0,
    pctExperts: total > 0 ? Math.round((experts / total) * 100) : 0,
  };
};

// Find weakest skills in category
const findWeakestSkills = (collaborators, skills, categoryId) => {
  const categorySkills = skills.filter(s => s.categoria === categoryId);
  
  const skillAverages = categorySkills.map(skill => {
    let sum = 0;
    let count = 0;

    collaborators.forEach(col => {
      if (col.skills[skill.id] && col.skills[skill.id].nivel > 0) {
        sum += col.skills[skill.id].nivel;
        count++;
      }
    });

    return {
      id: skill.id,
      nombre: skill.nombre,
      average: count > 0 ? sum / count : 0,
      evaluated: count,
    };
  });

  return skillAverages
    .filter(s => s.evaluated > 0)
    .sort((a, b) => a.average - b.average)
    .slice(0, 3);
};

// Distribution Bar Component (Pure HTML/Tailwind)
function DistributionBar({ beginners, competent, experts, pctBeginners, pctCompetent, pctExperts }) {
  const total = beginners + competent + experts;
  
  if (total === 0) {
    return (
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden" title="Sin datos">
        <div className="h-full w-full bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {pctBeginners > 0 && (
          <div 
            className="bg-warning transition-all duration-300 group-hover:opacity-80"
            style={{ width: `${pctBeginners}%` }}
          />
        )}
        {pctCompetent > 0 && (
          <div 
            className="bg-competent transition-all duration-300 group-hover:opacity-80"
            style={{ width: `${pctCompetent}%` }}
          />
        )}
        {pctExperts > 0 && (
          <div 
            className="bg-primary transition-all duration-300 group-hover:opacity-80"
            style={{ width: `${pctExperts}%` }}
          />
        )}
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          <span className="text-warning">{beginners} Principiantes</span>
          <span className="mx-1">•</span>
          <span className="text-competent">{competent} Competentes</span>
          <span className="mx-1">•</span>
          <span className="text-primary">{experts} Expertos</span>
        </div>
      </div>
    </div>
  );
}

// Weakest Skills List
function WeakestSkillsList({ skills }) {
  if (skills.length === 0) {
    return <p className="text-sm text-gray-400">No hay datos suficientes</p>;
  }

  return (
    <div className="space-y-2">
      {skills.map(skill => (
        <div 
          key={skill.id}
          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-sm text-gray-700">{skill.nombre}</span>
          </div>
          <span className={`text-sm font-medium tabular-nums ${
            skill.average < 2 ? 'text-critical' : 
            skill.average < 2.5 ? 'text-warning' : 'text-gray-500'
          }`}>
            {skill.average.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Main Component
export default function CategoryHealthCard({ 
  category, 
  collaborators = [], 
  skills = [], 
  roleProfiles = {} 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const distribution = calculateDistribution(collaborators, skills, category.id, roleProfiles);
  const weakestSkills = findWeakestSkills(collaborators, skills, category.id);

  // Overall health indicator
  const healthScore = distribution.total > 0 
    ? (distribution.experts * 3 + distribution.competent * 2 + distribution.beginners * 1) / distribution.total
    : 0;
  const healthLabel = healthScore >= 2.5 ? 'Saludable' : healthScore >= 2 ? 'Moderado' : 'Requiere atención';

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            {isExpanded ? (
              <ChevronDown size={18} className="text-gray-400 mt-1" />
            ) : (
              <ChevronRight size={18} className="text-gray-400 mt-1" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-800">{category.nombre}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{category.abrev}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={14} />
            <span className="tabular-nums">{distribution.total}</span>
          </div>
        </div>

        {/* Distribution Bar */}
        <div className="mt-4 mb-3">
          <DistributionBar {...distribution} />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>Principiantes ({distribution.pctBeginners}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-competent" />
            <span>Competentes ({distribution.pctCompetent}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Expertos ({distribution.pctExperts}%)</span>
          </div>
        </div>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-6 bg-gray-50/30 animate-fade-in">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" />
            Top 3 Skills Más Débiles
          </h4>
          <WeakestSkillsList skills={weakestSkills} />
          
          {/* Health Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Estado general: <span className={`font-medium ${
                healthScore >= 2.5 ? 'text-primary' : 
                healthScore >= 2 ? 'text-warning' : 'text-critical'
              }`}>{healthLabel}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
