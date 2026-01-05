/**
 * Rich Seed Data V3 - CHAOS TESTING EDITION
 * 
 * 8 Archetypes designed to break the UI:
 * 1. Lucía "One-Shot" - Single evaluation
 * 2. Ana Rodríguez - Recent role change (UX→PO)
 * 3. Miguel Ángel - Recent role change (Backend→Tech Lead)
 * 4. Roberto "El Fantasma" - Inactive user
 * 5. The Contractor - Undefined profile
 * 6. Luis "Burnout" - Negative trend
 * 7. Don Pedro - Legacy expert (inactive category)
 * 8. Sofía - Perfect reference baseline
 * 
 * Business Rules Enforced:
 * - If frecuencia='N' → criticidad must be 'N'
 * - Contractor → criticidad always 'N'
 */

// ============================================
// CATEGORIES (Including Legacy inactive)
// ============================================
export const CATEGORIES = [
  { id: 1, nombre: 'Innovación & Diseño', abrev: 'Innovación', active: true },
  { id: 2, nombre: 'Desarrollo & Plataforma Técnica', abrev: 'Desarrollo', active: true },
  { id: 3, nombre: 'Liderazgo del Cambio', abrev: 'Liderazgo', active: true },
  { id: 4, nombre: 'Negocio & Estrategia', abrev: 'Negocio', active: true },
  { id: 5, nombre: 'Entrega & Portafolio', abrev: 'Entrega', active: true },
  { id: 6, nombre: 'Tecnologías Emergentes', abrev: 'Emergentes', active: true },
  // CHAOS: Inactive category with skills
  { id: 99, nombre: 'Legacy Systems', abrev: 'Legacy', active: false },
];

// ============================================
// SKILLS (Including Legacy)
// ============================================
export const SKILLS = [
  // Category 1: Innovación
  { id: 1, categoriaId: 1, nombre: 'Design Thinking', active: true },
  { id: 2, categoriaId: 1, nombre: 'Service Design', active: true },
  { id: 3, categoriaId: 1, nombre: 'Lean Startup', active: true },
  { id: 4, categoriaId: 1, nombre: 'User Research', active: true },
  { id: 5, categoriaId: 1, nombre: 'Customer Journey Mapping', active: true },
  { id: 6, categoriaId: 1, nombre: 'Stage-Gate Methodology', active: true },
  
  // Category 2: Desarrollo
  { id: 7, categoriaId: 2, nombre: 'Cloud Infrastructure & DevOps', active: true },
  { id: 8, categoriaId: 2, nombre: 'Arquitectura de Sistemas', active: true },
  { id: 9, categoriaId: 2, nombre: 'Desarrollo Backend', active: true },
  { id: 10, categoriaId: 2, nombre: 'Desarrollo Frontend', active: true },
  { id: 11, categoriaId: 2, nombre: 'Integración de APIs', active: true },
  { id: 12, categoriaId: 2, nombre: 'Low-code/No-code', active: true },
  { id: 13, categoriaId: 2, nombre: 'Ciberseguridad', active: true },
  { id: 14, categoriaId: 2, nombre: 'Testing/QA', active: true },
  { id: 36, categoriaId: 2, nombre: 'UX/UI Design', active: true },
  { id: 37, categoriaId: 2, nombre: 'Observabilidad & SRE', active: true },
  { id: 40, categoriaId: 2, nombre: 'Git & Version Control', active: true },
  
  // Category 3: Liderazgo
  { id: 15, categoriaId: 3, nombre: 'Change Management', active: true },
  { id: 16, categoriaId: 3, nombre: 'Workshop Facilitation', active: true },
  { id: 17, categoriaId: 3, nombre: 'Training Design', active: true },
  { id: 18, categoriaId: 3, nombre: 'Storytelling & Communication', active: true },
  
  // Category 4: Negocio
  { id: 19, categoriaId: 4, nombre: 'Business Case Development', active: true },
  { id: 20, categoriaId: 4, nombre: 'Financial Modeling', active: true },
  { id: 21, categoriaId: 4, nombre: 'Data Analytics', active: true },
  { id: 22, categoriaId: 4, nombre: 'Risk Assessment', active: true },
  { id: 23, categoriaId: 4, nombre: 'Market Research', active: true },
  { id: 24, categoriaId: 4, nombre: 'Strategic Planning', active: true },
  { id: 25, categoriaId: 4, nombre: 'Executive Communication', active: true },
  { id: 26, categoriaId: 4, nombre: 'Process Documentation', active: true },
  
  // Category 5: Entrega
  { id: 29, categoriaId: 5, nombre: 'Agile/Scrum', active: true },
  { id: 30, categoriaId: 5, nombre: 'Portfolio Management', active: true },
  { id: 31, categoriaId: 5, nombre: 'Stakeholder Management', active: true },
  { id: 32, categoriaId: 5, nombre: 'Process Automation', active: true },
  { id: 33, categoriaId: 5, nombre: 'Project Management', active: true },
  { id: 34, categoriaId: 5, nombre: 'Product Management', active: true },
  
  // Category 6: Emergentes
  { id: 35, categoriaId: 6, nombre: 'AI & Prompt Engineering', active: true },
  { id: 38, categoriaId: 6, nombre: 'AI Agents', active: true },
  { id: 39, categoriaId: 6, nombre: 'IoT & Edge', active: true },
  
  // CHAOS: Legacy category skills (inactive category)
  { id: 97, categoriaId: 99, nombre: 'COBOL Programming', active: false },
  { id: 98, categoriaId: 99, nombre: 'Mainframe Administration', active: false },
];

// ============================================
// JOB PROFILES (Defined in system)
// ============================================
export const JOB_PROFILES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Tech Lead',
  'UX Designer',
  'Product Owner',
  'DevOps Engineer',
  'QA Engineer',
  'Data Scientist',
  'Mainframe Specialist',
  // CHAOS: Profile exists but no one has it
  'Security Guard',
];
// NOTE: 'External Consultant' and 'Intern' are NOT in this list (undefined profiles)

// ============================================
// COLLABORATORS BASE (8 Archetypes)
// ============================================
export const COLLABORATORS_BASE = [
  // 🆕 1. LUCÍA "ONE-SHOT" - Single evaluation
  { id: 201, nombre: 'Lucía Fernández', rol: 'Frontend Developer', avatar: 'LF', active: true, archetype: 'ONE_SHOT' },
  
  // 🔀 2. ANA RODRÍGUEZ - Recent role change (UX→PO)
  { id: 202, nombre: 'Ana Rodríguez', rol: 'Product Owner', previousRol: 'UX Designer', avatar: 'AR', active: true, archetype: 'ROLE_CHANGE_1' },
  
  // 🔀 3. MIGUEL ÁNGEL - Recent role change (Backend→Tech Lead)
  { id: 203, nombre: 'Miguel Ángel Torres', rol: 'Tech Lead', previousRol: 'Backend Developer', avatar: 'MT', active: true, archetype: 'ROLE_CHANGE_2' },
  
  // 💀 4. ROBERTO "EL FANTASMA" - Inactive user (resigned Jan 2025)
  { id: 204, nombre: 'Roberto Fantasma', rol: 'Backend Developer', avatar: 'RF', active: false, archetype: 'INACTIVE', resignedDate: '2025-01-15' },
  
  // 👻 5. THE CONTRACTOR - Undefined profile
  { id: 205, nombre: 'Contractor', rol: 'External Consultant', avatar: 'CO', active: true, archetype: 'NO_PROFILE' },
  
  // 📉 6. LUIS "BURNOUT" - Negative trend
  { id: 206, nombre: 'Luis Hernández', rol: 'Backend Developer', avatar: 'LH', active: true, archetype: 'BURNOUT' },
  
  // 🦕 7. DON PEDRO - Legacy expert (inactive category skills)
  { id: 207, nombre: 'Pedro Mainframe', rol: 'Mainframe Specialist', avatar: 'PM', active: true, archetype: 'LEGACY_EXPERT' },
  
  // 🌟 8. SOFÍA - Perfect reference baseline
  { id: 208, nombre: 'Sofía Martínez', rol: 'Tech Lead', avatar: 'SM', active: true, archetype: 'REFERENCE' },
];

// ============================================
// SNAPSHOT DATES (2024-2025)
// ============================================
export const SNAPSHOT_DATES = [
  '2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31',
  '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31', '2025-12-31',
];

// ============================================
// SKILL CATEGORIES FOR GENERATION
// ============================================
const SKILL_IDS = {
  INNOVATION: [1, 2, 3, 4, 5, 6],
  TECHNICAL: [7, 8, 9, 10, 11, 12, 13, 14, 36, 37, 40],
  LEADERSHIP: [15, 16, 17, 18],
  BUSINESS: [19, 20, 21, 22, 23, 24, 25, 26],
  DELIVERY: [29, 30, 31, 32, 33, 34],
  EMERGING: [35, 38, 39],
  LEGACY: [97, 98],
};

const ACTIVE_SKILLS = [
  ...SKILL_IDS.INNOVATION, ...SKILL_IDS.TECHNICAL, ...SKILL_IDS.LEADERSHIP,
  ...SKILL_IDS.BUSINESS, ...SKILL_IDS.DELIVERY, ...SKILL_IDS.EMERGING,
];

// ============================================
// BUSINESS RULES VALIDATORS
// ============================================
const generateConsistentFreqCrit = (nivel, isContractor = false) => {
  // RULE: Contractor always has criticidad = 'N'
  if (isContractor) {
    return { frecuencia: nivel > 0 ? 'M' : 'N', criticidad: 'N' };
  }
  
  let frecuencia, criticidad;
  
  if (nivel >= 4.0) {
    frecuencia = Math.random() > 0.3 ? 'D' : 'S';
    criticidad = Math.random() > 0.2 ? 'C' : 'I';
  } else if (nivel >= 3.0) {
    frecuencia = Math.random() > 0.5 ? 'S' : 'M';
    criticidad = Math.random() > 0.4 ? 'I' : 'C';
  } else if (nivel >= 2.0) {
    frecuencia = Math.random() > 0.3 ? 'M' : 'S';
    criticidad = Math.random() > 0.5 ? 'I' : 'D';
  } else if (nivel > 0) {
    frecuencia = Math.random() > 0.4 ? 'M' : 'N';
    criticidad = 'D';
    // RULE: If frecuencia = 'N', criticidad must be 'N'
    if (frecuencia === 'N') criticidad = 'N';
  } else {
    frecuencia = 'N';
    criticidad = 'N';
  }
  
  return { frecuencia, criticidad };
};

const generateSkillSet = (baseLevel, options = {}) => {
  const { variation = 0.3, isContractor = false, naSkills = [], includeLegacy = false, highSkills = [], lowSkills = [] } = options;
  const skills = {};
  const skillList = includeLegacy ? [...ACTIVE_SKILLS, ...SKILL_IDS.LEGACY] : ACTIVE_SKILLS;
  
  skillList.forEach(skillId => {
    if (naSkills.includes(skillId)) {
      skills[skillId] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
      return;
    }
    
    let nivel = baseLevel + (Math.random() - 0.5) * variation * 2;
    if (highSkills.includes(skillId)) nivel = Math.min(5, nivel + 1.0);
    if (lowSkills.includes(skillId)) nivel = Math.max(0, nivel - 1.5);
    nivel = Math.max(0, Math.min(5, nivel));
    nivel = Math.round(nivel * 10) / 10;
    
    const { frecuencia, criticidad } = generateConsistentFreqCrit(nivel, isContractor);
    skills[skillId] = { nivel, frecuencia, criticidad };
  });
  
  return skills;
};

const calculateAverage = (skills) => {
  const values = Object.values(skills).filter(s => s.nivel > 0).map(s => s.nivel);
  return values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
};

// ============================================
// HISTORY SNAPSHOTS GENERATOR
// ============================================
const generateHistorySnapshots = () => {
  const snapshots = [];
  
  // ============================================
  // 🆕 1. LUCÍA "ONE-SHOT" - Only Dec 2025
  // ============================================
  snapshots.push({
    collaboratorId: 201,
    date: '2025-12-31',
    rol: 'Frontend Developer',
    skills: generateSkillSet(3.0, { highSkills: [10, 36, 40] }),
  });

  // ============================================
  // 🔀 2. ANA RODRÍGUEZ - 18 months UX, then PO
  // ============================================
  // 2024: Full year as UX Designer
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31'].forEach(date => {
    snapshots.push({
      collaboratorId: 202,
      date,
      rol: 'UX Designer',
      skills: generateSkillSet(4.0, { highSkills: [1, 2, 4, 36] }),
    });
  });
  // 2025 Q1-Q3: Still UX Designer
  ['2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31'].forEach(date => {
    snapshots.push({
      collaboratorId: 202,
      date,
      rol: 'UX Designer',
      skills: generateSkillSet(4.2, { highSkills: [1, 2, 4, 36] }),
    });
  });
  // 2025-12: ROLE CHANGE to Product Owner
  snapshots.push({
    collaboratorId: 202,
    date: '2025-12-31',
    rol: 'Product Owner',
    rolChanged: true,
    skills: generateSkillSet(3.0, { highSkills: [34, 31, 29], lowSkills: [9, 10] }),
  });

  // ============================================
  // 🔀 3. MIGUEL ÁNGEL - 2 years Backend, then Tech Lead
  // ============================================
  // 2024: Full year as Backend Developer
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31'].forEach(date => {
    snapshots.push({
      collaboratorId: 203,
      date,
      rol: 'Backend Developer',
      skills: generateSkillSet(3.8, { highSkills: [9, 8, 7, 40] }),
    });
  });
  // 2025 Q1-Q3: Still Backend
  ['2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31'].forEach(date => {
    snapshots.push({
      collaboratorId: 203,
      date,
      rol: 'Backend Developer',
      skills: generateSkillSet(4.0, { highSkills: [9, 8, 7, 40] }),
    });
  });
  // 2025-12: ROLE CHANGE to Tech Lead
  snapshots.push({
    collaboratorId: 203,
    date: '2025-12-31',
    rol: 'Tech Lead',
    rolChanged: true,
    skills: generateSkillSet(3.2, { highSkills: [9, 8, 7], lowSkills: [15, 16, 17, 18] }), // Lower in leadership (new area)
  });

  // ============================================
  // 💀 4. ROBERTO "EL FANTASMA" - Worked 2024, resigned Jan 2025
  // ============================================
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31'].forEach(date => {
    snapshots.push({
      collaboratorId: 204,
      date,
      rol: 'Backend Developer',
      skills: generateSkillSet(3.5),
    });
  });
  // NO 2025 snapshots - resigned

  // ============================================
  // 👻 5. THE CONTRACTOR - Sporadic data, no profile
  // ============================================
  // Only 3 snapshots spread out (data gaps)
  ['2024-06-30', '2025-04-30', '2025-12-31'].forEach(date => {
    const naSkills = [...SKILL_IDS.INNOVATION, ...SKILL_IDS.LEADERSHIP, ...SKILL_IDS.DELIVERY];
    snapshots.push({
      collaboratorId: 205,
      date,
      rol: 'External Consultant',
      skills: generateSkillSet(3.5, { isContractor: true, naSkills }),
    });
  });

  // ============================================
  // 📉 6. LUIS "BURNOUT" - Negative trend last 6 months
  // ============================================
  const luisTrend = [3.8, 4.0, 4.0, 3.9, 3.6, 3.3, 3.0, 2.7, 2.4, 2.2];
  SNAPSHOT_DATES.forEach((date, idx) => {
    const skills = generateSkillSet(luisTrend[idx], { lowSkills: idx >= 6 ? SKILL_IDS.LEADERSHIP : [] });
    
    // Force explicit burnout gaps in leadership for last 4 snapshots
    if (idx >= 6) {
      skills[15] = { nivel: 1.5, frecuencia: 'M', criticidad: 'C' }; // Critical gap
      skills[16] = { nivel: 1.2, frecuencia: 'M', criticidad: 'C' };
      skills[18] = { nivel: 1.3, frecuencia: 'S', criticidad: 'C' };
    }
    
    snapshots.push({
      collaboratorId: 206,
      date,
      rol: 'Backend Developer',
      skills,
    });
  });

  // ============================================
  // 🦕 7. DON PEDRO - Legacy expert (inactive category)
  // ============================================
  SNAPSHOT_DATES.forEach(date => {
    const skills = generateSkillSet(3.0, { includeLegacy: true });
    
    // CHAOS: High skills in legacy category (inactive)
    skills[97] = { nivel: 5.0, frecuencia: 'D', criticidad: 'C' }; // COBOL master
    skills[98] = { nivel: 4.8, frecuencia: 'D', criticidad: 'C' }; // Mainframe wizard
    
    // Low in modern tech
    skills[35] = { nivel: 0.5, frecuencia: 'N', criticidad: 'N' }; // AI = nope
    skills[38] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
    
    snapshots.push({
      collaboratorId: 207,
      date,
      rol: 'Mainframe Specialist',
      skills,
    });
  });

  // ============================================
  // 🌟 8. SOFÍA - Perfect reference baseline
  // ============================================
  SNAPSHOT_DATES.forEach(date => {
    snapshots.push({
      collaboratorId: 208,
      date,
      rol: 'Tech Lead',
      skills: generateSkillSet(4.3, { variation: 0.15, highSkills: [7, 8, 9, 15, 16, 40] }),
    });
  });

  // Calculate averages
  return snapshots.map(s => ({
    ...s,
    promedio: calculateAverage(s.skills),
  }));
};

// ============================================
// EXPORTS
// ============================================
export const HISTORY_SNAPSHOTS = generateHistorySnapshots();

export const getCollaboratorHistory = (collaboratorId) => {
  return HISTORY_SNAPSHOTS.filter(s => s.collaboratorId === collaboratorId).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getLatestSnapshot = (collaboratorId) => {
  const history = getCollaboratorHistory(collaboratorId);
  return history[history.length - 1] || null;
};

export const getActiveCollaborators = () => {
  return COLLABORATORS_BASE.filter(c => c.active);
};

export const getInactiveCollaborators = () => {
  return COLLABORATORS_BASE.filter(c => !c.active);
};

export const getCollaboratorsWithLatestData = (includeInactive = false) => {
  const collabs = includeInactive ? COLLABORATORS_BASE : getActiveCollaborators();
  return collabs.map(collab => ({
    ...collab,
    ...getLatestSnapshot(collab.id),
    evaluationSessions: getCollaboratorHistory(collab.id),
  }));
};

export const hasRoleProfile = (rol) => {
  return JOB_PROFILES.includes(rol);
};

export const logDataStats = () => {
  console.log('=== CHAOS TESTING SEED DATA V3 ===');
  console.log(`Categories: ${CATEGORIES.length} (${CATEGORIES.filter(c => !c.active).length} inactive)`);
  console.log(`Skills: ${SKILLS.length} (${SKILLS.filter(s => !s.active).length} inactive)`);
  console.log(`Job Profiles: ${JOB_PROFILES.length}`);
  console.log(`Collaborators: ${COLLABORATORS_BASE.length} (${getInactiveCollaborators().length} inactive)`);
  console.log(`Total Snapshots: ${HISTORY_SNAPSHOTS.length}`);
  console.log('');
  console.log('📌 Archetypes:');
  COLLABORATORS_BASE.forEach(c => {
    const history = getCollaboratorHistory(c.id);
    const status = c.active ? '✅' : '💀';
    const profile = hasRoleProfile(c.rol) ? '📋' : '⚠️';
    console.log(`  ${status} ${c.nombre}: ${history.length} snapshots (${c.rol}) ${profile}`);
  });
  
  // Validate rules
  let violations = 0;
  HISTORY_SNAPSHOTS.forEach(snap => {
    Object.values(snap.skills).forEach(s => {
      if (s.frecuencia === 'N' && s.criticidad !== 'N' && s.criticidad !== 'D') violations++;
      if ((s.criticidad === 'C' || s.criticidad === 'I') && s.frecuencia === 'N') violations++;
    });
  });
  console.log(`\n🔍 Business Rule Violations: ${violations}`);
};
