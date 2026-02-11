/**
 * Shared Seed Data - Constants & Generation Functions
 *
 * Used by:
 * - prisma/seed.js (dev seeding via `npm run db:seed`)
 * - src/routes/demo.js (demo mode seeding via POST /api/seed-demo)
 *
 * 10 Archetypes for comprehensive testing:
 * 1. Lucia "One-Shot" - Single evaluation
 * 2. Ana Rodriguez - Role change (UX -> PO)
 * 3. Roberto "El Fantasma" - Inactive/Resigned
 * 4. Juana "Contractor" - No profile, no evaluations
 * 5. Luis "Burnout" - Negative trend
 * 6. Don Pedro - Legacy expert (inactive category)
 * 7. Sofia - Perfect reference baseline with critical gaps
 * 8. Carmen - Rising star with critical gaps
 * 9. Carlos - Growth champion
 * 10. Miguel Angel - Gap resolution case
 */

// ============================================
// CATEGORIES (Including Legacy inactive)
// ============================================
export const CATEGORIES = [
  { id: 1, nombre: 'Innovacion & Diseno', abrev: 'Innovacion' },
  { id: 2, nombre: 'Desarrollo & Plataforma Tecnica', abrev: 'Desarrollo' },
  { id: 3, nombre: 'Liderazgo del Cambio', abrev: 'Liderazgo' },
  { id: 4, nombre: 'Negocio & Estrategia', abrev: 'Negocio' },
  { id: 5, nombre: 'Entrega & Portafolio', abrev: 'Entrega' },
  { id: 6, nombre: 'Tecnologias Emergentes', abrev: 'Emergentes' },
  { id: 99, nombre: 'Legacy Systems', abrev: 'Legacy', isActive: false },
];

// ============================================
// SKILLS
// ============================================
export const SKILLS = [
  { id: 1, categoriaId: 1, nombre: 'Design Thinking' },
  { id: 2, categoriaId: 1, nombre: 'Service Design' },
  { id: 3, categoriaId: 1, nombre: 'Lean Startup' },
  { id: 4, categoriaId: 1, nombre: 'User Research' },
  { id: 5, categoriaId: 1, nombre: 'Customer Journey Mapping' },
  { id: 6, categoriaId: 1, nombre: 'Stage-Gate Methodology' },
  { id: 7, categoriaId: 2, nombre: 'Cloud Infrastructure & DevOps' },
  { id: 8, categoriaId: 2, nombre: 'Arquitectura de Sistemas' },
  { id: 9, categoriaId: 2, nombre: 'Desarrollo Backend' },
  { id: 10, categoriaId: 2, nombre: 'Desarrollo Frontend' },
  { id: 11, categoriaId: 2, nombre: 'Integracion de APIs' },
  { id: 12, categoriaId: 2, nombre: 'Low-code/No-code' },
  { id: 13, categoriaId: 2, nombre: 'Ciberseguridad' },
  { id: 14, categoriaId: 2, nombre: 'Testing/QA' },
  { id: 15, categoriaId: 3, nombre: 'Change Management' },
  { id: 16, categoriaId: 3, nombre: 'Workshop Facilitation' },
  { id: 17, categoriaId: 3, nombre: 'Training Design' },
  { id: 18, categoriaId: 3, nombre: 'Storytelling & Communication' },
  { id: 19, categoriaId: 4, nombre: 'Business Case Development' },
  { id: 20, categoriaId: 4, nombre: 'Financial Modeling' },
  { id: 21, categoriaId: 4, nombre: 'Data Analytics' },
  { id: 22, categoriaId: 4, nombre: 'Risk Assessment' },
  { id: 23, categoriaId: 4, nombre: 'Market Research' },
  { id: 24, categoriaId: 4, nombre: 'Strategic Planning' },
  { id: 25, categoriaId: 4, nombre: 'Executive Communication' },
  { id: 26, categoriaId: 4, nombre: 'Process Documentation' },
  { id: 29, categoriaId: 5, nombre: 'Agile/Scrum' },
  { id: 30, categoriaId: 5, nombre: 'Portfolio Management' },
  { id: 31, categoriaId: 5, nombre: 'Stakeholder Management' },
  { id: 32, categoriaId: 5, nombre: 'Process Automation' },
  { id: 33, categoriaId: 5, nombre: 'Project Management' },
  { id: 34, categoriaId: 5, nombre: 'Product Management' },
  { id: 35, categoriaId: 6, nombre: 'AI & Prompt Engineering' },
  { id: 36, categoriaId: 2, nombre: 'UX/UI Design' },
  { id: 37, categoriaId: 2, nombre: 'Observabilidad & SRE' },
  { id: 38, categoriaId: 6, nombre: 'AI Agents' },
  { id: 39, categoriaId: 6, nombre: 'IoT & Edge' },
  { id: 40, categoriaId: 2, nombre: 'Git & Version Control' },
  // Legacy skills (inactive category)
  { id: 97, categoriaId: 99, nombre: 'COBOL Programming', isActive: false },
  { id: 98, categoriaId: 99, nombre: 'Mainframe Administration', isActive: false },
];

// ============================================
// COLLABORATORS (10 Archetypes with diverse join dates)
// ============================================
export const COLLABORATORS = [
  { id: 201, nombre: 'Lucia Fernandez', rol: 'Frontend Developer', esDemo: true, isActive: true, joinedAt: new Date('2025-12-01') },
  { id: 202, nombre: 'Ana Rodriguez', rol: 'Product Owner', esDemo: true, isActive: true, joinedAt: new Date('2023-05-15') },
  { id: 204, nombre: 'Roberto Fantasma', rol: 'Backend Developer', esDemo: true, isActive: false, joinedAt: new Date('2023-01-10') },
  { id: 205, nombre: 'Juana Diaz', rol: 'External Consultant', esDemo: true, isActive: true, joinedAt: new Date('2025-06-01') },
  { id: 206, nombre: 'Luis Hernandez', rol: 'Backend Developer', esDemo: true, isActive: true, joinedAt: new Date('2023-01-20') },
  { id: 207, nombre: 'Pedro Rosario', rol: 'Innovation Specialist', esDemo: true, isActive: true, joinedAt: new Date('2022-02-01') },
  { id: 208, nombre: 'Sofia Martinez', rol: 'Tech Lead', esDemo: true, isActive: true, joinedAt: new Date('2021-08-15') },
  { id: 209, nombre: 'Carmen Rivera', rol: 'Frontend Developer', esDemo: true, isActive: true, joinedAt: new Date('2025-06-15') },
  { id: 210, nombre: 'Carlos Mejia', rol: 'UX Designer', esDemo: true, isActive: true, joinedAt: new Date('2022-12-01') },
  { id: 211, nombre: 'Miguel Angel Torres', rol: 'UX Designer', esDemo: true, isActive: true, joinedAt: new Date('2024-06-01') },
];

// ============================================
// ROLE PROFILES
// ============================================
export const ROLE_PROFILES = [
  {
    rol: 'Frontend Developer',
    skills: JSON.stringify({
      "10": "C", "36": "C", "40": "C", "14": "C", "11": "C",
      "9": "I", "12": "I", "29": "I", "33": "I", "8": "I", "7": "I", "13": "I",
      "1": "D", "2": "D", "4": "D", "5": "D", "18": "D", "15": "D", "16": "D",
      "21": "D", "25": "D", "31": "D", "32": "D", "35": "D", "37": "D", "34": "D", "3": "D", "6": "D"
    })
  },
  {
    rol: 'Backend Developer',
    skills: JSON.stringify({
      "9": "C", "8": "C", "11": "C", "40": "C", "13": "C", "7": "C",
      "14": "I", "37": "I", "29": "I", "10": "I", "12": "I", "33": "I", "32": "I",
      "21": "D", "35": "D", "38": "D", "39": "D", "18": "D", "15": "D", "24": "D",
      "31": "D", "1": "D", "19": "D", "22": "D", "25": "D", "34": "D", "30": "D"
    })
  },
  {
    rol: 'Tech Lead',
    skills: JSON.stringify({
      "8": "C", "9": "C", "15": "C", "18": "C", "33": "C", "40": "C", "31": "C",
      "7": "I", "16": "I", "17": "I", "25": "I", "10": "I", "11": "I", "13": "I",
      "14": "I", "29": "I", "30": "I",
      "21": "D", "24": "D", "37": "D", "35": "D", "38": "D", "1": "D", "19": "D",
      "22": "D", "32": "D", "34": "D", "12": "D", "23": "D"
    })
  },
  {
    rol: 'UX Designer',
    skills: JSON.stringify({
      "1": "C", "2": "C", "4": "C", "36": "C", "5": "C", "3": "C",
      "18": "I", "10": "I", "16": "I", "6": "I", "17": "I", "23": "I", "29": "I",
      "19": "D", "21": "D", "25": "D", "31": "D", "33": "D", "15": "D", "35": "D",
      "34": "D", "24": "D", "30": "D", "32": "D", "40": "D", "12": "D", "14": "D"
    })
  },
  {
    rol: 'Product Owner',
    skills: JSON.stringify({
      "34": "C", "31": "C", "29": "C", "25": "C", "19": "C", "30": "C",
      "23": "I", "24": "I", "21": "I", "33": "I", "4": "I", "1": "I", "18": "I", "15": "I",
      "16": "D", "17": "D", "22": "D", "20": "D", "26": "D", "5": "D", "2": "D",
      "3": "D", "6": "D", "35": "D", "32": "D", "36": "D", "10": "D", "14": "D"
    })
  },
  {
    rol: 'Innovation Specialist',
    skills: JSON.stringify({
      "97": "C", "98": "C", "1": "C", "3": "C", "35": "C",
      "2": "I", "38": "I", "8": "I", "6": "I", "39": "I", "24": "I", "4": "I", "5": "I",
      "18": "D", "15": "D", "16": "D", "17": "D", "19": "D", "21": "D", "23": "D",
      "25": "D", "31": "D", "33": "D", "34": "D", "29": "D", "30": "D"
    })
  },
  { rol: 'Security Guard', skills: JSON.stringify({}) },
];

// ============================================
// SNAPSHOT DATES
// ============================================
export const SNAPSHOT_DATES = [
  '2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31',
  '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31', '2025-12-31',
];

// ============================================
// SKILL CATEGORIES (IDs grouped by category)
// ============================================
export const SKILL_IDS = {
  INNOVATION: [1, 2, 3, 4, 5, 6],
  TECHNICAL: [7, 8, 9, 10, 11, 12, 13, 14, 36, 37, 40],
  LEADERSHIP: [15, 16, 17, 18],
  BUSINESS: [19, 20, 21, 22, 23, 24, 25, 26],
  DELIVERY: [29, 30, 31, 32, 33, 34],
  EMERGING: [35, 38, 39],
  LEGACY: [97, 98],
};

export const ACTIVE_SKILLS = [
  ...SKILL_IDS.INNOVATION, ...SKILL_IDS.TECHNICAL, ...SKILL_IDS.LEADERSHIP,
  ...SKILL_IDS.BUSINESS, ...SKILL_IDS.DELIVERY, ...SKILL_IDS.EMERGING,
];

// ============================================
// GENERATION FUNCTIONS
// ============================================

export const generateConsistentFreqCrit = (nivel, isContractor = false) => {
  if (nivel <= 0) {
    return { frecuencia: 'N', criticidad: 'N' };
  }

  if (isContractor) {
    return { frecuencia: 'M', criticidad: 'D' };
  }

  let frecuencia, criticidad;
  const rand = Math.random();

  if (nivel >= 4.0) {
    frecuencia = rand > 0.3 ? 'D' : 'S';
    criticidad = rand > 0.2 ? 'C' : 'I';
  } else if (nivel >= 3.0) {
    frecuencia = rand > 0.4 ? 'S' : 'M';
    criticidad = rand > 0.4 ? 'I' : 'C';
  } else if (nivel >= 2.0) {
    frecuencia = rand > 0.3 ? 'M' : 'S';
    criticidad = rand > 0.5 ? 'I' : 'D';
  } else {
    frecuencia = rand > 0.5 ? 'M' : 'T';
    criticidad = 'D';
  }

  if (frecuencia === 'N' || criticidad === 'N') {
    frecuencia = 'M';
    criticidad = 'D';
  }

  return { frecuencia, criticidad };
};

export const generateSkillSet = (baseLevel, options = {}) => {
  const { variation = 0.3, roleProfile = {}, includeLegacy = false, highSkills = [], lowSkills = [] } = options;
  const skills = {};
  const skillList = includeLegacy ? [...ACTIVE_SKILLS, ...SKILL_IDS.LEGACY] : ACTIVE_SKILLS;

  skillList.forEach(skillId => {
    const skillIdStr = String(skillId);
    const profileCriticidad = roleProfile[skillIdStr] || 'N';

    if (profileCriticidad === 'N') {
      skills[skillId] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
      return;
    }

    let nivel = baseLevel + (Math.random() - 0.5) * variation * 2;
    if (highSkills.includes(skillId)) nivel = Math.min(5, nivel + 1.0);
    if (lowSkills.includes(skillId)) nivel = Math.max(1, nivel - 1.5);
    nivel = Math.max(1, Math.min(5, nivel));
    nivel = Math.round(nivel * 10) / 10;

    const { frecuencia } = generateConsistentFreqCrit(nivel);
    skills[skillId] = { nivel, frecuencia, criticidad: profileCriticidad };
  });

  return skills;
};

export const zeroCategorySkills = (skills, categorySkillIds) => {
  categorySkillIds.forEach(skillId => {
    skills[skillId] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
  });
  return skills;
};

export const getRoleProfile = (roleName) => {
  const profile = ROLE_PROFILES.find(p => p.rol === roleName);
  if (!profile) return {};
  return typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
};

export const generateSnapshots = () => {
  const snapshots = [];

  // 1. LUCIA - Only Dec 2025 (one-shot)
  const luciaProfile = getRoleProfile('Frontend Developer');
  snapshots.push({ collaboratorId: 201, date: '2025-12-31', rol: 'Frontend Developer', skills: generateSkillSet(3.0, { roleProfile: luciaProfile, highSkills: [10, 36, 40] }) });

  // 2. ANA - 18 months UX, then PO (no Technical skills)
  const uxProfile = getRoleProfile('UX Designer');
  const poProfile = getRoleProfile('Product Owner');
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31', '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31'].forEach(date => {
    const skills = generateSkillSet(4.2, { roleProfile: uxProfile, highSkills: [1, 2, 4, 36] });
    zeroCategorySkills(skills, SKILL_IDS.TECHNICAL);
    snapshots.push({ collaboratorId: 202, date, rol: 'UX Designer', skills });
  });
  const anaPoSkills = generateSkillSet(3.0, { roleProfile: poProfile, highSkills: [34, 31, 29] });
  zeroCategorySkills(anaPoSkills, SKILL_IDS.TECHNICAL);
  snapshots.push({ collaboratorId: 202, date: '2025-12-31', rol: 'Product Owner', rolChanged: true, skills: anaPoSkills });

  // 3. ROBERTO - Only 2024 (resigned Jan 2025)
  const backendProfile = getRoleProfile('Backend Developer');
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31'].forEach(date => {
    snapshots.push({ collaboratorId: 204, date, rol: 'Backend Developer', skills: generateSkillSet(3.5, { roleProfile: backendProfile }) });
  });

  // 4. JUANA (CONTRACTOR) - No evaluations (undefined profile)

  // 5. LUIS - Burnout trend
  const luisTrend = [3.8, 4.0, 4.0, 3.9, 3.6, 3.3, 3.0, 2.7, 2.4, 2.2];
  SNAPSHOT_DATES.forEach((date, idx) => {
    const skills = generateSkillSet(luisTrend[idx], { roleProfile: backendProfile, lowSkills: idx >= 6 ? SKILL_IDS.LEADERSHIP : [] });
    if (idx >= 6) {
      skills[15] = { nivel: 1.5, frecuencia: 'M', criticidad: 'I' };
      skills[16] = { nivel: 1.2, frecuencia: 'M', criticidad: 'I' };
      skills[18] = { nivel: 1.3, frecuencia: 'S', criticidad: 'I' };
    }
    snapshots.push({ collaboratorId: 206, date, rol: 'Backend Developer', skills });
  });

  // 6. DON PEDRO - Legacy expert (no Delivery skills)
  const innovationProfile = getRoleProfile('Innovation Specialist');
  SNAPSHOT_DATES.forEach(date => {
    const skills = generateSkillSet(3.0, { roleProfile: innovationProfile, includeLegacy: true });
    skills[97] = { nivel: 5.0, frecuencia: 'D', criticidad: 'C' };
    skills[98] = { nivel: 4.8, frecuencia: 'D', criticidad: 'C' };
    zeroCategorySkills(skills, SKILL_IDS.DELIVERY);
    snapshots.push({ collaboratorId: 207, date, rol: 'Innovation Specialist', skills });
  });

  // 7. SOFIA - Near perfect but critical gaps in Business skills
  const techLeadProfile = getRoleProfile('Tech Lead');
  SNAPSHOT_DATES.forEach(date => {
    const skills = generateSkillSet(4.3, { roleProfile: techLeadProfile, variation: 0.15, highSkills: [7, 8, 9, 15, 16, 40] });
    skills[31] = { nivel: 1.5, frecuencia: 'D', criticidad: 'C' };
    skills[33] = { nivel: 1.8, frecuencia: 'D', criticidad: 'C' };
    snapshots.push({ collaboratorId: 208, date, rol: 'Tech Lead', skills });
  });

  // 8. CARMEN - Rising star with critical gaps in Testing (no Emerging skills)
  const frontendProfile = getRoleProfile('Frontend Developer');
  const carmenTrend = [2.5, 2.8, 3.2, 3.5, 3.8, 4.0];
  ['2025-06-30', '2025-07-31', '2025-08-31', '2025-09-30', '2025-10-31', '2025-12-31'].forEach((date, idx) => {
    const skills = generateSkillSet(carmenTrend[idx], { roleProfile: frontendProfile, highSkills: [10, 36, 40] });
    skills[14] = { nivel: 1.2, frecuencia: 'D', criticidad: 'C' };
    skills[11] = { nivel: 1.6, frecuencia: 'S', criticidad: 'C' };
    zeroCategorySkills(skills, SKILL_IDS.EMERGING);
    snapshots.push({ collaboratorId: 209, date, rol: 'Frontend Developer', skills });
  });

  // 9. CARLOS - Growth champion (positive 12m trend, no Emerging skills)
  const carlosTrend = [2.8, 3.0, 3.2, 3.4, 3.5, 3.7, 3.8, 4.0, 4.1, 4.3];
  SNAPSHOT_DATES.forEach((date, idx) => {
    const skills = generateSkillSet(carlosTrend[idx], { roleProfile: uxProfile, highSkills: [1, 2, 4, 36] });
    zeroCategorySkills(skills, SKILL_IDS.EMERGING);
    snapshots.push({ collaboratorId: 210, date, rol: 'UX Designer', skills });
  });

  // 10. MIGUEL - Gap Resolution Case (no Innovation skills)
  const miguelTrend = [
    { date: '2024-06-30', l: 2.2, low: [1, 2] },
    { date: '2024-09-30', l: 2.8, low: [1] },
    { date: '2024-12-31', l: 3.2, low: [] },
    { date: '2025-06-30', l: 3.8, low: [] },
    { date: '2025-10-30', l: 4.2, low: [] }
  ];

  miguelTrend.forEach(t => {
    const skills = generateSkillSet(t.l, { roleProfile: uxProfile, lowSkills: t.low });
    if (t.low.includes(1)) { skills[1] = { nivel: 2.0, frecuencia: 'D', criticidad: 'C' }; }
    if (t.low.includes(2)) { skills[2] = { nivel: 2.2, frecuencia: 'D', criticidad: 'C' }; }
    if (t.l >= 4.0) {
      skills[1] = { nivel: 4.5, frecuencia: 'D', criticidad: 'C' };
      skills[2] = { nivel: 4.2, frecuencia: 'D', criticidad: 'C' };
    }
    zeroCategorySkills(skills, SKILL_IDS.INNOVATION);
    snapshots.push({ collaboratorId: 211, date: t.date, rol: 'UX Designer', skills });
  });

  return snapshots;
};
