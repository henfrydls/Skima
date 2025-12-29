/**
 * Mock Data para Skills Matrix FOSS
 * 
 * Datos adaptados de database.template.json con modelo real:
 * - Criticidad definida POR EMPLEADO, POR SKILL (no global)
 * - Basada en frecuencia de uso en el rol
 * 
 * Códigos:
 * - Frecuencia: D=Diario, S=Semanal, M=Mensual, T=Trimestral, N=Nunca
 * - Criticidad: C=Crítico, I=Importante, D=Deseable, N=No aplica
 */

// Categorías de skills
export const CATEGORIES = [
  { id: 1, nombre: 'Innovación & Diseño', abrev: 'Innovación' },
  { id: 2, nombre: 'Desarrollo & Plataforma Técnica', abrev: 'Desarrollo' },
  { id: 3, nombre: 'Liderazgo del Cambio', abrev: 'Cambio' },
  { id: 4, nombre: 'Negocio & Estrategia', abrev: 'Negocio' },
  { id: 5, nombre: 'Entrega & Portafolio', abrev: 'Entrega' },
  { id: 6, nombre: 'Tecnologías Emergentes', abrev: 'Emergentes' },
];

// Skills por categoría
export const SKILLS = [
  // Innovación & Diseño (cat 1)
  { id: 1, categoria: 1, nombre: 'Design Thinking' },
  { id: 2, categoria: 1, nombre: 'Service Design' },
  { id: 3, categoria: 1, nombre: 'Lean Startup / Experimentación ágil' },
  { id: 4, categoria: 1, nombre: 'User Research & Human-Centered Design' },
  { id: 5, categoria: 1, nombre: 'Customer Journey Mapping' },
  { id: 6, categoria: 1, nombre: 'Stage-Gate Methodology' },
  
  // Desarrollo & Plataforma Técnica (cat 2)
  { id: 7, categoria: 2, nombre: 'Cloud Infrastructure & DevOps' },
  { id: 8, categoria: 2, nombre: 'Arquitectura de Sistemas' },
  { id: 9, categoria: 2, nombre: 'Desarrollo Backend (Django, APIs)' },
  { id: 10, categoria: 2, nombre: 'Desarrollo Frontend (HTMX, JS)' },
  { id: 11, categoria: 2, nombre: 'Integración de Sistemas y APIs' },
  { id: 12, categoria: 2, nombre: 'Low-code/No-code' },
  { id: 13, categoria: 2, nombre: 'Ciberseguridad' },
  { id: 14, categoria: 2, nombre: 'Testing/QA' },
  { id: 36, categoria: 2, nombre: 'UX/UI Design & Prototyping' },
  { id: 37, categoria: 2, nombre: 'Observabilidad & SRE' },
  { id: 40, categoria: 2, nombre: 'Control de versiones (Git)' },
  
  // Liderazgo del Cambio (cat 3)
  { id: 15, categoria: 3, nombre: 'Change Management' },
  { id: 16, categoria: 3, nombre: 'Workshop Facilitation' },
  { id: 17, categoria: 3, nombre: 'Training Design & Delivery' },
  { id: 18, categoria: 3, nombre: 'Storytelling & Communication' },
  
  // Negocio & Estrategia (cat 4)
  { id: 19, categoria: 4, nombre: 'Business Case Development' },
  { id: 20, categoria: 4, nombre: 'Financial Modeling & ROI' },
  { id: 21, categoria: 4, nombre: 'Data Analytics & Visualization' },
  { id: 22, categoria: 4, nombre: 'Risk Assessment' },
  { id: 23, categoria: 4, nombre: 'Market Research' },
  { id: 24, categoria: 4, nombre: 'Strategic Planning' },
  { id: 25, categoria: 4, nombre: 'Executive Communication' },
  { id: 26, categoria: 4, nombre: 'Documentación de Procesos' },
  
  // Entrega & Portafolio (cat 5)
  { id: 29, categoria: 5, nombre: 'Agile/Scrum' },
  { id: 30, categoria: 5, nombre: 'Portfolio Management' },
  { id: 31, categoria: 5, nombre: 'Stakeholder Management' },
  { id: 32, categoria: 5, nombre: 'Process Automation' },
  { id: 33, categoria: 5, nombre: 'Project Management' },
  { id: 34, categoria: 5, nombre: 'Product Management' },
  
  // Tecnologías Emergentes (cat 6)
  { id: 35, categoria: 6, nombre: 'AI & Prompt Engineering' },
  { id: 38, categoria: 6, nombre: 'AI Agents & Workflows' },
  { id: 39, categoria: 6, nombre: 'IoT & Edge Computing' },
];

// Colaboradores con sus evaluaciones
export const COLLABORATORS = [
  {
    id: 1,
    nombre: 'María González',
    rol: 'Product Manager',
    skills: {
      1: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      2: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      3: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      4: { nivel: 3.5, frecuencia: 'S', criticidad: 'I' },
      5: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      6: { nivel: 3.5, frecuencia: 'M', criticidad: 'D' },
      7: { nivel: 0.7, frecuencia: 'N', criticidad: 'I' },
      8: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      9: { nivel: 0.7, frecuencia: 'N', criticidad: 'D' },
      10: { nivel: 0.7, frecuencia: 'N', criticidad: 'D' },
      11: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      12: { nivel: 0.7, frecuencia: 'S', criticidad: 'C' },
      13: { nivel: 0.7, frecuencia: 'N', criticidad: 'I' },
      14: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      15: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      16: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      17: { nivel: 2.9, frecuencia: 'S', criticidad: 'C' },
      18: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      19: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      20: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      21: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      22: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      23: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      24: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      25: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      26: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      29: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      30: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      31: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      32: { nivel: 2.9, frecuencia: 'S', criticidad: 'I' },
      33: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      34: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      35: { nivel: 1.9, frecuencia: 'S', criticidad: 'I' },
      36: { nivel: 0.7, frecuencia: 'M', criticidad: 'D' },
      37: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      38: { nivel: 1.9, frecuencia: 'M', criticidad: 'I' },
      39: { nivel: 1.9, frecuencia: 'T', criticidad: 'D' },
      40: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
    },
  },
  {
    id: 2,
    nombre: 'Carlos Mendez',
    rol: 'Arquitecto Cloud',
    skills: {
      1: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      2: { nivel: 3.5, frecuencia: 'T', criticidad: 'D' },
      3: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      4: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      5: { nivel: 3.5, frecuencia: 'T', criticidad: 'D' },
      6: { nivel: 3.5, frecuencia: 'M', criticidad: 'D' },
      7: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      8: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      9: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      10: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
      11: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      12: { nivel: 1.4, frecuencia: 'S', criticidad: 'I' },
      13: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      14: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
      15: { nivel: 2.9, frecuencia: 'N', criticidad: 'D' },
      16: { nivel: 2.9, frecuencia: 'N', criticidad: 'D' },
      17: { nivel: 2.9, frecuencia: 'T', criticidad: 'D' },
      18: { nivel: 2.9, frecuencia: 'M', criticidad: 'I' },
      19: { nivel: 2.6, frecuencia: 'M', criticidad: 'D' },
      20: { nivel: 2.6, frecuencia: 'N', criticidad: 'D' },
      21: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      22: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      23: { nivel: 2.6, frecuencia: 'M', criticidad: 'D' },
      24: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      25: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      26: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      29: { nivel: 2.6, frecuencia: 'D', criticidad: 'I' },
      30: { nivel: 2.6, frecuencia: 'M', criticidad: 'D' },
      31: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      32: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      33: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      34: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      35: { nivel: 2.8, frecuencia: 'D', criticidad: 'I' },
      36: { nivel: 1.4, frecuencia: 'S', criticidad: 'I' },
      37: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      38: { nivel: 2.5, frecuencia: 'S', criticidad: 'C' },
      39: { nivel: 1.6, frecuencia: 'M', criticidad: 'I' },
      40: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
    },
  },
  {
    id: 3,
    nombre: 'Ana Rodríguez',
    rol: 'Consultora de Innovación',
    skills: {
      1: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      2: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      3: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      4: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
      5: { nivel: 4.0, frecuencia: 'S', criticidad: 'C' },
      6: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      7: { nivel: 1.8, frecuencia: 'N', criticidad: 'N' },
      8: { nivel: 1.8, frecuencia: 'N', criticidad: 'D' },
      9: { nivel: 1.8, frecuencia: 'N', criticidad: 'N' },
      10: { nivel: 1.8, frecuencia: 'N', criticidad: 'D' },
      11: { nivel: 1.8, frecuencia: 'N', criticidad: 'D' },
      12: { nivel: 2.5, frecuencia: 'M', criticidad: 'I' },
      13: { nivel: 1.8, frecuencia: 'N', criticidad: 'N' },
      14: { nivel: 1.8, frecuencia: 'N', criticidad: 'N' },
      15: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      16: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
      17: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      18: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      19: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      20: { nivel: 3.0, frecuencia: 'S', criticidad: 'C' },
      21: { nivel: 3.2, frecuencia: 'D', criticidad: 'C' },
      22: { nivel: 3.0, frecuencia: 'S', criticidad: 'I' },
      23: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      24: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      25: { nivel: 3.5, frecuencia: 'S', criticidad: 'I' },
      26: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      29: { nivel: 2.8, frecuencia: 'D', criticidad: 'I' },
      30: { nivel: 2.8, frecuencia: 'M', criticidad: 'I' },
      31: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      32: { nivel: 2.8, frecuencia: 'M', criticidad: 'D' },
      33: { nivel: 2.8, frecuencia: 'S', criticidad: 'I' },
      34: { nivel: 2.8, frecuencia: 'S', criticidad: 'I' },
      35: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
      36: { nivel: 1.8, frecuencia: 'M', criticidad: 'D' },
      37: { nivel: 1.8, frecuencia: 'T', criticidad: 'D' },
      38: { nivel: 1.7, frecuencia: 'T', criticidad: 'D' },
      39: { nivel: 1.7, frecuencia: 'N', criticidad: 'N' },
      40: { nivel: 1.5, frecuencia: 'M', criticidad: 'D' },
    },
  },
  {
    id: 4,
    nombre: 'Pedro Sánchez',
    rol: 'Líder de Plataforma',
    skills: {
      1: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      2: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      3: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      4: { nivel: 3.5, frecuencia: 'S', criticidad: 'I' },
      5: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      6: { nivel: 3.5, frecuencia: 'M', criticidad: 'D' },
      7: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      8: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      9: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      10: { nivel: 3.0, frecuencia: 'S', criticidad: 'I' },
      11: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      12: { nivel: 2.8, frecuencia: 'S', criticidad: 'C' },
      13: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      14: { nivel: 3.0, frecuencia: 'S', criticidad: 'I' },
      15: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      16: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      17: { nivel: 2.9, frecuencia: 'S', criticidad: 'C' },
      18: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      19: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      20: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      21: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      22: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      23: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      24: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      25: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      26: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      29: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      30: { nivel: 2.5, frecuencia: 'D', criticidad: 'C' },
      31: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
      32: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
      33: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
      34: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      35: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
      36: { nivel: 2.8, frecuencia: 'M', criticidad: 'D' },
      37: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      38: { nivel: 1.5, frecuencia: 'M', criticidad: 'I' },
      39: { nivel: 1.5, frecuencia: 'T', criticidad: 'I' },
      40: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
    },
  },
  {
    id: 5,
    nombre: 'Laura Torres',
    rol: 'Junior Developer',
    skills: {
      1: { nivel: 1.5, frecuencia: 'M', criticidad: 'I' },
      2: { nivel: 1.0, frecuencia: 'T', criticidad: 'D' },
      3: { nivel: 1.5, frecuencia: 'M', criticidad: 'I' },
      4: { nivel: 1.2, frecuencia: 'M', criticidad: 'I' },
      5: { nivel: 1.0, frecuencia: 'T', criticidad: 'D' },
      6: { nivel: 0.5, frecuencia: 'N', criticidad: 'N' },
      7: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' },
      8: { nivel: 1.5, frecuencia: 'S', criticidad: 'C' },
      9: { nivel: 2.5, frecuencia: 'D', criticidad: 'C' },
      10: { nivel: 2.8, frecuencia: 'D', criticidad: 'C' },
      11: { nivel: 1.8, frecuencia: 'S', criticidad: 'C' },
      12: { nivel: 1.0, frecuencia: 'M', criticidad: 'I' },
      13: { nivel: 1.2, frecuencia: 'S', criticidad: 'I' },
      14: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' },
      15: { nivel: 1.0, frecuencia: 'N', criticidad: 'D' },
      16: { nivel: 0.8, frecuencia: 'N', criticidad: 'D' },
      17: { nivel: 0.5, frecuencia: 'N', criticidad: 'N' },
      18: { nivel: 1.2, frecuencia: 'M', criticidad: 'I' },
      19: { nivel: 0.8, frecuencia: 'N', criticidad: 'D' },
      20: { nivel: 0.5, frecuencia: 'N', criticidad: 'N' },
      21: { nivel: 1.5, frecuencia: 'M', criticidad: 'I' },
      22: { nivel: 0.8, frecuencia: 'N', criticidad: 'D' },
      23: { nivel: 0.5, frecuencia: 'N', criticidad: 'N' },
      24: { nivel: 0.8, frecuencia: 'N', criticidad: 'D' },
      25: { nivel: 1.0, frecuencia: 'M', criticidad: 'I' },
      26: { nivel: 1.5, frecuencia: 'S', criticidad: 'I' },
      29: { nivel: 2.5, frecuencia: 'D', criticidad: 'C' },
      30: { nivel: 0.8, frecuencia: 'N', criticidad: 'D' },
      31: { nivel: 1.2, frecuencia: 'M', criticidad: 'I' },
      32: { nivel: 1.0, frecuencia: 'M', criticidad: 'I' },
      33: { nivel: 1.5, frecuencia: 'S', criticidad: 'I' },
      34: { nivel: 1.0, frecuencia: 'M', criticidad: 'I' },
      35: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' },
      36: { nivel: 1.0, frecuencia: 'M', criticidad: 'I' },
      37: { nivel: 0.8, frecuencia: 'M', criticidad: 'I' },
      38: { nivel: 1.5, frecuencia: 'S', criticidad: 'I' },
      39: { nivel: 0.5, frecuencia: 'N', criticidad: 'N' },
      40: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
    },
  },
];

// Helper: Agrupar skills por categoría
export const getSkillsByCategory = () => {
  const grouped = {};
  CATEGORIES.forEach(cat => {
    grouped[cat.id] = {
      ...cat,
      skills: SKILLS.filter(s => s.categoria === cat.id),
    };
  });
  return grouped;
};

// Helper: Verificar si hay brecha crítica
// Brecha crítica = skill con criticidad 'C' y nivel < 3
export const isCriticalGap = (skillData) => {
  if (!skillData) return false;
  return skillData.criticidad === 'C' && skillData.nivel < 3;
};

// Helper: Calcular métricas del dashboard
export const calculateMetrics = () => {
  const totalEmployees = COLLABORATORS.length;
  
  // Brechas críticas: skills con criticidad 'C' y nivel < 3
  let criticalGaps = 0;
  
  COLLABORATORS.forEach(emp => {
    Object.values(emp.skills).forEach(skillData => {
      if (isCriticalGap(skillData)) {
        criticalGaps++;
      }
    });
  });
  
  // Promedio de nivel general
  let totalLevels = 0;
  let totalEvals = 0;
  
  COLLABORATORS.forEach(emp => {
    Object.values(emp.skills).forEach(skillData => {
      totalLevels += skillData.nivel;
      totalEvals++;
    });
  });
  
  const averageLevel = totalEvals > 0 ? (totalLevels / totalEvals).toFixed(1) : 0;
  
  return {
    totalEmployees,
    criticalGaps,
    averageLevel,
  };
};

// Helper: Top skills con brechas (solo skills críticas con nivel bajo)
export const getTopMissingSkills = () => {
  const skillGaps = {};
  
  COLLABORATORS.forEach(emp => {
    Object.entries(emp.skills).forEach(([skillId, data]) => {
      if (isCriticalGap(data)) {
        if (!skillGaps[skillId]) {
          skillGaps[skillId] = { count: 0, employees: [] };
        }
        skillGaps[skillId].count++;
        skillGaps[skillId].employees.push(emp.nombre);
      }
    });
  });
  
  // Convertir a array con info de skill
  return Object.entries(skillGaps)
    .map(([skillId, data]) => {
      const skill = SKILLS.find(s => s.id === parseInt(skillId));
      const category = CATEGORIES.find(c => c.id === skill?.categoria);
      return {
        id: parseInt(skillId),
        name: skill?.nombre || 'Unknown',
        category: category?.abrev || 'Unknown',
        employeesWithGap: data.count,
        gapPercentage: (data.count / COLLABORATORS.length) * 100,
      };
    })
    .sort((a, b) => b.gapPercentage - a.gapPercentage)
    .slice(0, 6);
};

// Mapeo de códigos de frecuencia
export const FREQUENCY_LABELS = {
  D: 'Diario',
  S: 'Semanal',
  M: 'Mensual',
  T: 'Trimestral',
  N: 'Nunca',
};

// Mapeo de códigos de criticidad
export const CRITICALITY_LABELS = {
  C: 'Crítico',
  I: 'Importante',
  D: 'Deseable',
  N: 'No aplica',
};
