/**
 * mockHistory.js - Enriched mock data for sparklines and historical comparisons
 * 
 * This provides fake data to make the UI work 100% immediately,
 * without complicating the fetch layer.
 */

// Sparkline data: array of last 3 evaluation averages per collaborator
export const sparklineHistory = {
  1: { points: [3.2, 3.5, 3.9], trend: 'up' },     // Ana Rodríguez - improving
  2: { points: [3.4, 3.6, 3.7], trend: 'up' },     // Carlos Mendez - slight improvement
  3: { points: [2.8, 2.5, 2.6], trend: 'down' },   // Contractor - declining
  4: { points: [4.2, 4.4, 4.5], trend: 'up' },     // Diana Prince - top performer
  5: { points: [1.2, 1.4, 1.5], trend: 'up' },     // Kevin Junior - new hire improving
  6: { points: [1.8, 1.9, 2.0], trend: 'neutral' },// Laura Torres - stable low
  7: { points: [2.8, 2.9, 3.0], trend: 'up' },     // María González - improving
  8: { points: [3.4, 3.5, 3.6], trend: 'up' },     // Pedro Sánchez - improving
};

// Previous snapshot data for historical comparison in drawer
export const previousSnapshots = {
  1: {
    evaluatedAt: '2025-07-15',
    promedio: 3.5,
    rol: 'Consultora de Innovación',
    categorias: {
      'Innovación': 3.2,
      'Desarrollo': 2.8,
      'Liderazgo': 3.6,
      'Negocio': 3.4,
      'Entrega': 3.0,
    }
  },
  2: {
    evaluatedAt: '2025-08-20',
    promedio: 3.6,
    rol: 'Arquitecto Cloud',
    categorias: {
      'Innovación': 2.5,
      'Desarrollo': 4.2,
      'Liderazgo': 3.0,
      'Negocio': 3.5,
      'Entrega': 3.8,
    }
  },
  4: {
    evaluatedAt: '2025-06-10',
    promedio: 4.4,
    rol: 'Engineering Director',
    categorias: {
      'Innovación': 4.0,
      'Desarrollo': 4.2,
      'Liderazgo': 4.8,
      'Negocio': 4.6,
      'Entrega': 4.4,
    }
  },
  6: {
    evaluatedAt: '2025-04-01',
    promedio: 1.9,
    rol: 'Intern', // Previous role before promotion
    categorias: {
      'Innovación': 1.5,
      'Desarrollo': 2.0,
      'Liderazgo': 1.2,
      'Negocio': 2.2,
      'Entrega': 1.8,
    }
  },
  7: {
    evaluatedAt: '2025-09-01',
    promedio: 2.9,
    rol: 'Product Manager',
    categorias: {
      'Innovación': 3.2,
      'Desarrollo': 2.0,
      'Liderazgo': 3.0,
      'Negocio': 3.4,
      'Entrega': 2.8,
    }
  },
  8: {
    evaluatedAt: '2025-07-20',
    promedio: 3.5,
    rol: 'Líder de Plataforma',
    categorias: {
      'Innovación': 2.8,
      'Desarrollo': 4.0,
      'Liderazgo': 3.2,
      'Negocio': 3.0,
      'Entrega': 3.8,
    }
  },
};

// Suggested actions for gaps based on criticality and level
export const suggestedActions = {
  'BRECHA_CRITICA': [
    { action: 'Capacitación urgente', icon: 'GraduationCap', priority: 'high' },
    { action: 'Mentoría intensiva', icon: 'Users', priority: 'high' },
  ],
  'AREA_MEJORA': [
    { action: 'Curso online', icon: 'BookOpen', priority: 'medium' },
    { action: 'Asignar como par en proyecto', icon: 'Briefcase', priority: 'medium' },
  ],
  'EN_DESARROLLO': [
    { action: 'Continuar práctica', icon: 'Target', priority: 'low' },
    { action: 'Revisar en próxima evaluación', icon: 'Calendar', priority: 'low' },
  ],
};

// Category distribution mock (for CategoryHealthCard)
// This will be calculated from real data, but mock shows structure
export const categoryDistributions = {
  1: { // Innovación & Diseño
    beginners: 2,  // <2.5
    competent: 4,  // 2.5-3.5
    experts: 2,    // >3.5
  },
  2: { // Desarrollo & Plataforma
    beginners: 1,
    competent: 3,
    experts: 4,
  },
  3: { // Liderazgo del Cambio
    beginners: 3,
    competent: 3,
    experts: 2,
  },
  4: { // Negocio & Estrategia
    beginners: 2,
    competent: 5,
    experts: 1,
  },
  5: { // Entrega & Portafolio
    beginners: 2,
    competent: 4,
    experts: 2,
  },
  6: { // Tecnologías Emergentes
    beginners: 4,
    competent: 3,
    experts: 1,
  },
};

// Helper: Get trend color
export const getTrendColor = (trend) => {
  if (trend === 'up') return '#10b981'; // success green
  if (trend === 'down') return '#ef4444'; // critical red
  return '#9ca3af'; // neutral gray
};

// Helper: Calculate delta for comparison
export const calculateDelta = (current, previous) => {
  if (!previous) return null;
  const delta = current - previous;
  return {
    value: delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
    formatted: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
  };
};
