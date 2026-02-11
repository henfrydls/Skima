/**
 * CHAOS TESTING SEED V3 - 8 Edge Case Archetypes
 * 
 * Run with: npm run db:seed
 * 
 * Archetypes:
 * 1. Lucía "One-Shot" - Single evaluation
 * 2. Ana Rodríguez - Recent role change (UX→PO)
 * 3. Miguel Ángel - Recent role change (Backend→Tech Lead)
 * 4. Roberto "El Fantasma" - Inactive user (resigned)
 * 5. The Contractor - Undefined profile
 * 6. Luis "Burnout" - Negative trend
 * 7. Don Pedro - Legacy expert (inactive category)
 * 8. Sofía - Perfect reference baseline
 * 
 * Business Rules:
 * - frecuencia='N' → criticidad='N'
 * - Contractor → criticidad='N' always
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ============================================
// CATEGORIES (Including Legacy inactive)
// ============================================
const CATEGORIES = [
  { id: 1, nombre: 'Innovación & Diseño', abrev: 'Innovación' },
  { id: 2, nombre: 'Desarrollo & Plataforma Técnica', abrev: 'Desarrollo' },
  { id: 3, nombre: 'Liderazgo del Cambio', abrev: 'Liderazgo' },
  { id: 4, nombre: 'Negocio & Estrategia', abrev: 'Negocio' },
  { id: 5, nombre: 'Entrega & Portafolio', abrev: 'Entrega' },
  { id: 6, nombre: 'Tecnologías Emergentes', abrev: 'Emergentes' },
  { id: 99, nombre: 'Legacy Systems', abrev: 'Legacy', isActive: false },
];

// ============================================
// SKILLS
// ============================================
const SKILLS = [
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
  { id: 11, categoriaId: 2, nombre: 'Integración de APIs' },
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
const COLLABORATORS = [
  { id: 201, nombre: 'Lucía Fernández', rol: 'Frontend Developer', esDemo: true, isActive: true, joinedAt: new Date('2025-12-01') }, // Brand new
  { id: 202, nombre: 'Ana Rodríguez', rol: 'Product Owner', esDemo: true, isActive: true, joinedAt: new Date('2023-05-15') }, // 2.5 years
  // 🔀 3. MIGUEL (old) - REMOVED

  { id: 204, nombre: 'Roberto Fantasma', rol: 'Backend Developer', esDemo: true, isActive: false, joinedAt: new Date('2023-01-10') }, // Resigned
  { id: 205, nombre: 'Juana Díaz', rol: 'External Consultant', esDemo: true, isActive: true, joinedAt: new Date('2025-06-01') }, // 6 months
  { id: 206, nombre: 'Luis Hernández', rol: 'Backend Developer', esDemo: true, isActive: true, joinedAt: new Date('2023-01-20') }, // 3 years (burnout case)
  { id: 207, nombre: 'Pedro Rosario', rol: 'Innovation Specialist', esDemo: true, isActive: true, joinedAt: new Date('2022-02-01') }, // Legacy veteran
  { id: 208, nombre: 'Sofía Martínez', rol: 'Tech Lead', esDemo: true, isActive: true, joinedAt: new Date('2021-08-15') }, // 4+ years senior
  { id: 209, nombre: 'Carmen Rivera', rol: 'Frontend Developer', esDemo: true, isActive: true, joinedAt: new Date('2025-06-15') }, // Rising star (6m)
  { id: 210, nombre: 'Carlos Mejía', rol: 'UX Designer', esDemo: true, isActive: true, joinedAt: new Date('2022-12-01') }, // Growth champion (long tenure)
  { id: 211, nombre: 'Miguel Ángel Torres', rol: 'UX Designer', esDemo: true, isActive: true, joinedAt: new Date('2024-06-01') }, // Specific Evolution Case
];

// ============================================
// ROLE PROFILES (Expanded for 80-85% coverage)
// Skills: 1-6 Innovation, 7-14/36/37/40 Technical, 15-18 Leadership, 
//         19-26 Business, 29-34 Delivery, 35/38/39 Emerging
// ============================================
const ROLE_PROFILES = [
  { 
    rol: 'Frontend Developer', 
    skills: JSON.stringify({ 
      // Critical (C) - Core competencies
      "10": "C", // Frontend Dev
      "36": "C", // UX/UI Design
      "40": "C", // Git
      "14": "C", // Testing/QA
      "11": "C", // APIs
      // Important (I) - Key supporting skills
      "9": "I",  // Backend
      "12": "I", // Low-code
      "29": "I", // Agile
      "33": "I", // Project Mgmt
      "8": "I",  // Arquitectura
      "7": "I",  // Cloud/DevOps
      "13": "I", // Ciberseguridad
      // Desirable (D) - Complementary
      "1": "D",  // Design Thinking
      "2": "D",  // Service Design
      "4": "D",  // User Research
      "5": "D",  // Customer Journey
      "18": "D", // Communication
      "15": "D", // Change Mgmt
      "16": "D", // Workshop
      "21": "D", // Analytics
      "25": "D", // Exec Comm
      "31": "D", // Stakeholder
      "32": "D", // Process Automation
      "35": "D", // AI Prompt
      "37": "D", // Observabilidad
      "34": "D", // Product Mgmt
      "3": "D",  // Lean Startup
      "6": "D"   // Stage-Gate
    }) 
  },
  { 
    rol: 'Backend Developer', 
    skills: JSON.stringify({ 
      // Critical
      "9": "C",  // Backend
      "8": "C",  // Arquitectura
      "11": "C", // APIs
      "40": "C", // Git
      "13": "C", // Ciberseguridad
      "7": "C",  // Cloud/DevOps
      // Important
      "14": "I", // Testing
      "37": "I", // Observabilidad
      "29": "I", // Agile
      "10": "I", // Frontend
      "12": "I", // Low-code
      "33": "I", // Project Mgmt
      "32": "I", // Process Automation
      // Desirable
      "21": "D", // Analytics
      "35": "D", // AI Prompt
      "38": "D", // AI Agents
      "39": "D", // IoT
      "18": "D", // Communication
      "15": "D", // Change Mgmt
      "24": "D", // Strategic
      "31": "D", // Stakeholder
      "1": "D",  // Design Thinking
      "19": "D", // Business Case
      "22": "D", // Risk Assessment
      "25": "D", // Exec Comm
      "34": "D", // Product Mgmt
      "30": "D"  // Portfolio Mgmt
    }) 
  },
  { 
    rol: 'Tech Lead', 
    skills: JSON.stringify({ 
      // Critical
      "8": "C",  // Arquitectura
      "9": "C",  // Backend
      "15": "C", // Change Mgmt
      "18": "C", // Communication
      "33": "C", // Project Mgmt
      "40": "C", // Git
      "31": "C", // Stakeholder
      // Important
      "7": "I",  // Cloud/DevOps
      "16": "I", // Workshop
      "17": "I", // Training
      "25": "I", // Exec Comm
      "10": "I", // Frontend
      "11": "I", // APIs
      "13": "I", // Ciberseguridad
      "14": "I", // Testing
      "29": "I", // Agile
      "30": "I", // Portfolio
      // Desirable
      "21": "D", // Analytics
      "24": "D", // Strategic
      "37": "D", // Observabilidad
      "35": "D", // AI Prompt
      "38": "D", // AI Agents
      "1": "D",  // Design Thinking
      "19": "D", // Business Case
      "22": "D", // Risk
      "32": "D", // Process Automation
      "34": "D", // Product Mgmt
      "12": "D", // Low-code
      "23": "D"  // Market Research
    }) 
  },
  { 
    rol: 'UX Designer', 
    skills: JSON.stringify({ 
      // Critical
      "1": "C",  // Design Thinking
      "2": "C",  // Service Design
      "4": "C",  // User Research
      "36": "C", // UX/UI
      "5": "C",  // Customer Journey
      "3": "C",  // Lean Startup
      // Important
      "18": "I", // Communication
      "10": "I", // Frontend
      "16": "I", // Workshop
      "6": "I",  // Stage-Gate
      "17": "I", // Training
      "23": "I", // Market Research
      "29": "I", // Agile
      // Desirable
      "19": "D", // Business Case
      "21": "D", // Analytics
      "25": "D", // Exec Comm
      "31": "D", // Stakeholder
      "33": "D", // Project Mgmt
      "15": "D", // Change Mgmt
      "35": "D", // AI Prompt
      "34": "D", // Product Mgmt
      "24": "D", // Strategic
      "30": "D", // Portfolio
      "32": "D", // Process Automation
      "40": "D", // Git
      "12": "D", // Low-code
      "14": "D"  // Testing
    }) 
  },
  { 
    rol: 'Product Owner', 
    skills: JSON.stringify({ 
      // Critical
      "34": "C", // Product Mgmt
      "31": "C", // Stakeholder
      "29": "C", // Agile
      "25": "C", // Exec Comm
      "19": "C", // Business Case
      "30": "C", // Portfolio
      // Important
      "23": "I", // Market Research
      "24": "I", // Strategic
      "21": "I", // Analytics
      "33": "I", // Project Mgmt
      "4": "I",  // User Research
      "1": "I",  // Design Thinking
      "18": "I", // Communication
      "15": "I", // Change Mgmt
      // Desirable
      "16": "D", // Workshop
      "17": "D", // Training
      "22": "D", // Risk
      "20": "D", // Financial Modeling
      "26": "D", // Process Doc
      "5": "D",  // Customer Journey
      "2": "D",  // Service Design
      "3": "D",  // Lean Startup
      "6": "D",  // Stage-Gate
      "35": "D", // AI Prompt
      "32": "D", // Process Automation
      "36": "D", // UX/UI
      "10": "D", // Frontend
      "14": "D"  // Testing
    }) 
  },
  { 
    rol: 'Innovation Specialist', 
    skills: JSON.stringify({ 
      // Critical - Legacy + Innovation core
      "97": "C", // COBOL
      "98": "C", // Mainframe
      "1": "C",  // Design Thinking
      "3": "C",  // Lean Startup
      "35": "C", // AI Prompt
      // Important
      "2": "I",  // Service Design
      "38": "I", // AI Agents
      "8": "I",  // Arquitectura
      "6": "I",  // Stage-Gate
      "39": "I", // IoT
      "24": "I", // Strategic
      "4": "I",  // User Research
      "5": "I",  // Customer Journey
      // Desirable
      "18": "D", // Communication
      "15": "D", // Change Mgmt
      "16": "D", // Workshop
      "17": "D", // Training
      "19": "D", // Business Case
      "21": "D", // Analytics
      "23": "D", // Market Research
      "25": "D", // Exec Comm
      "31": "D", // Stakeholder
      "33": "D", // Project Mgmt
      "34": "D", // Product Mgmt
      "29": "D", // Agile
      "30": "D"  // Portfolio
    }) 
  },
  { rol: 'Security Guard', skills: JSON.stringify({}) },
];

// ============================================
// SNAPSHOT DATES
// ============================================
const SNAPSHOT_DATES = [
  '2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31',
  '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31', '2025-12-31',
];

// ============================================
// SKILL CATEGORIES
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
// BUSINESS RULES
// ============================================
const generateConsistentFreqCrit = (nivel, isContractor = false) => {
  // RULE 1: If Level is 0, Freq and Crit MUST be 'N'
  if (nivel <= 0) {
    return { frecuencia: 'N', criticidad: 'N' };
  }
  
  // RULE 2: If Level > 0, Freq and Crit MUST NOT be 'N' (unless valid exception)
  // Contractor check: If user requires "N/A implies no evaluation", then Contractors
  // with Level > 0 MUST have Crit != 'N'. Let's give them 'D' (Desirable).
  if (isContractor) {
    return { frecuencia: 'M', criticidad: 'D' };
  }
  
  let frecuencia, criticidad;
  const rand = Math.random();
  
  if (nivel >= 4.0) {
    frecuencia = rand > 0.3 ? 'D' : 'S'; // Daily/Weekly
    criticidad = rand > 0.2 ? 'C' : 'I'; // Critical/Important
  } else if (nivel >= 3.0) {
    frecuencia = rand > 0.4 ? 'S' : 'M'; // Weekly/Monthly
    criticidad = rand > 0.4 ? 'I' : 'C'; // Important/Critical
  } else if (nivel >= 2.0) {
    frecuencia = rand > 0.3 ? 'M' : 'S'; // Monthly/Weekly
    criticidad = rand > 0.5 ? 'I' : 'D'; // Important/Desirable
  } else {
    // Low level (0.1 - 1.9)
    frecuencia = rand > 0.5 ? 'M' : 'T'; // Monthly/Trimestral
    criticidad = 'D'; // Desirable
  }
  
  // Final Safety Check
  if (frecuencia === 'N' || criticidad === 'N') {
    // Should not happen with logic above for nivel > 0
    frecuencia = 'M';
    criticidad = 'D';
  }
  
  return { frecuencia, criticidad };
};

const generateSkillSet = (baseLevel, options = {}) => {
  const { variation = 0.3, roleProfile = {}, includeLegacy = false, highSkills = [], lowSkills = [] } = options;
  const skills = {};
  const skillList = includeLegacy ? [...ACTIVE_SKILLS, ...SKILL_IDS.LEGACY] : ACTIVE_SKILLS;
  
  skillList.forEach(skillId => {
    const skillIdStr = String(skillId);
    // Get criticality from role profile. If not defined or 'N', skill is N/A.
    const profileCriticidad = roleProfile[skillIdStr] || 'N';
    
    // If skill is N/A for this role, set to zero
    if (profileCriticidad === 'N') {
      skills[skillId] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
      return;
    }
    
    // Skill is required (C/I/D) - generate level
    let nivel = baseLevel + (Math.random() - 0.5) * variation * 2;
    if (highSkills.includes(skillId)) nivel = Math.min(5, nivel + 1.0);
    if (lowSkills.includes(skillId)) nivel = Math.max(1, nivel - 1.5); // Min 1 for required skills
    nivel = Math.max(1, Math.min(5, nivel)); // Required skills must have at least level 1
    nivel = Math.round(nivel * 10) / 10;
    
    // Generate frequency based on level (but criticidad comes from profile!)
    const { frecuencia } = generateConsistentFreqCrit(nivel);
    
    // Use criticidad from profile, not random
    skills[skillId] = { nivel, frecuencia, criticidad: profileCriticidad };
  });
  
  return skills;
};

// Helper to zero out a category from a skills object
const zeroCategorySkills = (skills, categorySkillIds) => {
  categorySkillIds.forEach(skillId => {
    skills[skillId] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
  });
  return skills;
};

// ============================================
// GENERATE SNAPSHOTS
// ============================================

// Helper to get role profile as object
const getRoleProfile = (roleName) => {
  const profile = ROLE_PROFILES.find(p => p.rol === roleName);
  if (!profile) return {};
  return typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
};

const generateSnapshots = () => {
  const snapshots = [];
  
  // 🆕 1. LUCÍA - Only Dec 2025
  const luciaProfile = getRoleProfile('Frontend Developer');
  snapshots.push({ collaboratorId: 201, date: '2025-12-31', rol: 'Frontend Developer', skills: generateSkillSet(3.0, { roleProfile: luciaProfile, highSkills: [10, 36, 40] }) });


  // 🔀 2. ANA - 18 months UX, then PO (NO Technical skills)
  const uxProfile = getRoleProfile('UX Designer');
  const poProfile = getRoleProfile('Product Owner');
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31', '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31'].forEach(date => {
    const skills = generateSkillSet(4.2, { roleProfile: uxProfile, highSkills: [1, 2, 4, 36] });
    zeroCategorySkills(skills, SKILL_IDS.TECHNICAL); // Remove Desarrollo & Plataforma Técnica
    snapshots.push({ collaboratorId: 202, date, rol: 'UX Designer', skills });
  });
  const anaPoSkills = generateSkillSet(3.0, { roleProfile: poProfile, highSkills: [34, 31, 29] });
  zeroCategorySkills(anaPoSkills, SKILL_IDS.TECHNICAL);
  snapshots.push({ collaboratorId: 202, date: '2025-12-31', rol: 'Product Owner', rolChanged: true, skills: anaPoSkills });



  // 💀 4. ROBERTO - Only 2024 (resigned Jan 2025)
  const backendProfile = getRoleProfile('Backend Developer');
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31'].forEach(date => {
    snapshots.push({ collaboratorId: 204, date, rol: 'Backend Developer', skills: generateSkillSet(3.5, { roleProfile: backendProfile }) });
  });

  // 👻 5. JUANA (CONTRACTOR) - No evaluations (undefined profile)
  // Removed: External Consultants without Role Profile should not have evaluations.

  // 📉 6. LUIS - Burnout trend
  const luisTrend = [3.8, 4.0, 4.0, 3.9, 3.6, 3.3, 3.0, 2.7, 2.4, 2.2];
  SNAPSHOT_DATES.forEach((date, idx) => {
    const skills = generateSkillSet(luisTrend[idx], { roleProfile: backendProfile, lowSkills: idx >= 6 ? SKILL_IDS.LEADERSHIP : [] });
    // Override specific leadership skills to show burnout (these are N/A for Backend, so we need to include them manually)
    if (idx >= 6) {
      skills[15] = { nivel: 1.5, frecuencia: 'M', criticidad: 'I' }; // Change Management (not in Backend profile, but showing burnout case)
      skills[16] = { nivel: 1.2, frecuencia: 'M', criticidad: 'I' };
      skills[18] = { nivel: 1.3, frecuencia: 'S', criticidad: 'I' };
    }
    snapshots.push({ collaboratorId: 206, date, rol: 'Backend Developer', skills });
  });

  // 🦕 7. DON PEDRO - Legacy expert (NO Delivery skills)
  const innovationProfile = getRoleProfile('Innovation Specialist');
  SNAPSHOT_DATES.forEach(date => {
    const skills = generateSkillSet(3.0, { roleProfile: innovationProfile, includeLegacy: true });
    // Override legacy skills (these ARE in his profile as Critical)
    skills[97] = { nivel: 5.0, frecuencia: 'D', criticidad: 'C' };
    skills[98] = { nivel: 4.8, frecuencia: 'D', criticidad: 'C' };
    zeroCategorySkills(skills, SKILL_IDS.DELIVERY); // Remove Entrega & Portafolio
    snapshots.push({ collaboratorId: 207, date, rol: 'Innovation Specialist', skills });
  });

  // 🌟 8. SOFÍA - Near perfect but has critical gaps in Business skills
  const techLeadProfile = getRoleProfile('Tech Lead');
  SNAPSHOT_DATES.forEach(date => {
    const skills = generateSkillSet(4.3, { roleProfile: techLeadProfile, variation: 0.15, highSkills: [7, 8, 9, 15, 16, 40] });
    // 🔴 CRITICAL GAPS: Low scores on Critical skills = Brecha Crítica
    skills[31] = { nivel: 1.5, frecuencia: 'D', criticidad: 'C' }; // Stakeholder Management - Critical but low
    skills[33] = { nivel: 1.8, frecuencia: 'D', criticidad: 'C' }; // Project Management - Critical but low
    snapshots.push({ collaboratorId: 208, date, rol: 'Tech Lead', skills });
  });

  // 🚀 9. CARMEN - Rising star but has critical gaps in Testing (NO Emerging skills)
  const frontendProfile = getRoleProfile('Frontend Developer');
  const carmenTrend = [2.5, 2.8, 3.2, 3.5, 3.8, 4.0]; // Jun -> Dec 2025 
  ['2025-06-30', '2025-07-31', '2025-08-31', '2025-09-30', '2025-10-31', '2025-12-31'].forEach((date, idx) => {
    const skills = generateSkillSet(carmenTrend[idx], { roleProfile: frontendProfile, highSkills: [10, 36, 40] });
    // 🔴 CRITICAL GAPS: Low scores on Critical skills = Brecha Crítica
    skills[14] = { nivel: 1.2, frecuencia: 'D', criticidad: 'C' }; // Testing/QA - Critical but very low
    skills[11] = { nivel: 1.6, frecuencia: 'S', criticidad: 'C' }; // APIs - Critical but low
    zeroCategorySkills(skills, SKILL_IDS.EMERGING); // Remove Tecnologías Emergentes
    snapshots.push({ collaboratorId: 209, date, rol: 'Frontend Developer', skills });
  });

  // 📈 10. CARLOS - Growth champion (positive 12m trend, NO Emerging skills)
  const carlosTrend = [2.8, 3.0, 3.2, 3.4, 3.5, 3.7, 3.8, 4.0, 4.1, 4.3];
  SNAPSHOT_DATES.forEach((date, idx) => {
    const skills = generateSkillSet(carlosTrend[idx], { roleProfile: uxProfile, highSkills: [1, 2, 4, 36] });
    zeroCategorySkills(skills, SKILL_IDS.EMERGING); // Remove Tecnologías Emergentes
    snapshots.push({ collaboratorId: 210, date, rol: 'UX Designer', skills });
  });

  // 🧪 11. MIGUEL (UX) - Gap Resolution Case (NO Innovation skills)
  const miguelTrend = [
    { date: '2024-06-30', l: 2.2, low: [1, 2] },
    { date: '2024-09-30', l: 2.8, low: [1] },
    { date: '2024-12-31', l: 3.2, low: [] },
    { date: '2025-06-30', l: 3.8, low: [] },
    { date: '2025-10-30', l: 4.2, low: [] }
  ];
  
  miguelTrend.forEach(t => {
    const skills = generateSkillSet(t.l, { roleProfile: uxProfile, lowSkills: t.low });
    // Force specific gap values (these are Critical in UX profile)
    if (t.low.includes(1)) { skills[1] = { nivel: 2.0, frecuencia: 'D', criticidad: 'C' }; }
    if (t.low.includes(2)) { skills[2] = { nivel: 2.2, frecuencia: 'D', criticidad: 'C' }; }
    
    // Force strength when solved
    if (t.l >= 4.0) {
      skills[1] = { nivel: 4.5, frecuencia: 'D', criticidad: 'C' };
      skills[2] = { nivel: 4.2, frecuencia: 'D', criticidad: 'C' };
    }
    
    zeroCategorySkills(skills, SKILL_IDS.INNOVATION); // Remove Innovación & Diseño

    snapshots.push({ collaboratorId: 211, date: t.date, rol: 'UX Designer', skills });
  });


  return snapshots;
};

// ============================================
// MAIN SEED
// ============================================
async function main() {
  console.log('🌱 CHAOS TESTING SEED V3');
  console.log('');
  console.log('📌 8 Archetypes for Edge Case Testing:');
  console.log('   🆕 Lucía One-Shot (1 evaluation)');
  console.log('   🔀 Ana (UX → Product Owner)');
  console.log('   🔀 Miguel (Backend → Tech Lead)');
  console.log('   💀 Roberto (Inactive/Resigned)');
  console.log('   👻 Contractor (No Profile)');
  console.log('   📉 Luis Burnout (Negative Trend)');
  console.log('   🦕 Don Pedro (Legacy Expert)');
  console.log('   🌟 Sofía (Reference Baseline)');
  console.log('');

  console.log('  ⚠️  Clearing ALL existing data...');
  await prisma.assessment.deleteMany();
  await prisma.evaluationSession.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
  await prisma.roleProfile.deleteMany();

  // Reset SystemConfig so setup wizard shows on next launch
  await prisma.systemConfig.deleteMany();
  console.log('  🔧 SystemConfig reset (setup wizard will show on next launch)');

  console.log('  📁 Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.create({ data: cat });
  }

  console.log('  🧠 Seeding skills...');
  for (const skill of SKILLS) {
    await prisma.skill.create({ data: skill });
  }

  console.log('  👥 Seeding 8 collaborators...');
  for (const collab of COLLABORATORS) {
    await prisma.collaborator.create({ data: collab });
  }

  console.log('  📋 Seeding role profiles...');
  for (const profile of ROLE_PROFILES) {
    await prisma.roleProfile.upsert({
      where: { rol: profile.rol },
      update: { skills: profile.skills },
      create: profile
    });
  }

  console.log('  📅 Generating chaos test history...');
  const snapshots = generateSnapshots();
  let totalSessions = 0;
  let totalAssessments = 0;
  let violations = 0;

  for (const snapshot of snapshots) {
    const { collaboratorId, date, rol, skills, rolChanged } = snapshot;
    const collab = COLLABORATORS.find(c => c.id === collaboratorId);
    
    const session = await prisma.evaluationSession.create({
      data: {
        collaboratorId,
        collaboratorNombre: collab.nombre,
        collaboratorRol: rol,
        evaluatedBy: 'Demo',
        notes: rolChanged ? '🔀 Cambio de rol detectado' : `Evaluación ${date}`,
        evaluatedAt: new Date(date)
      }
    });
    totalSessions++;

    for (const [skillId, data] of Object.entries(skills)) {
      // COMPREHENSIVE VIOLATION CHECK
      // Rule 1: If criticidad = 'N' (N/A), nivel MUST be 0 and frecuencia MUST be 'N'
      if (data.criticidad === 'N') {
        if (data.nivel > 0) {
          console.warn(`  ⚠️ VIOLATION: Skill ${skillId} has N/A criticidad but nivel=${data.nivel}`);
          violations++;
        }
        if (data.frecuencia !== 'N') {
          console.warn(`  ⚠️ VIOLATION: Skill ${skillId} has N/A criticidad but frecuencia=${data.frecuencia}`);
          violations++;
        }
      }
      // Rule 2: If criticidad != 'N' (C/I/D), frecuencia MUST NOT be 'N'
      if (data.criticidad !== 'N' && data.frecuencia === 'N') {
        console.warn(`  ⚠️ VIOLATION: Skill ${skillId} has criticidad=${data.criticidad} but frecuencia=N`);
        violations++;
      }
      
      await prisma.assessment.create({
        data: {
          collaboratorId,
          skillId: parseInt(skillId),
          nivel: data.nivel,
          criticidad: data.criticidad,
          frecuencia: data.frecuencia,
          evaluationSessionId: session.id,
          createdAt: new Date(date)
        }
      });
      totalAssessments++;
    }
  }

  console.log('  🔄 Updating lastEvaluated timestamps...');
  for (const collab of COLLABORATORS) {
    const lastSession = await prisma.evaluationSession.findFirst({
      where: { collaboratorId: collab.id },
      orderBy: { evaluatedAt: 'desc' }
    });
    if (lastSession) {
      await prisma.collaborator.update({
        where: { id: collab.id },
        data: { lastEvaluated: lastSession.evaluatedAt }
      });
    }
  }

  console.log('');
  console.log('✅ CHAOS TESTING SEED V3 completed!');
  console.log(`   📁 ${CATEGORIES.length} categories (1 inactive)`);
  console.log(`   🧠 ${SKILLS.length} skills (2 legacy)`);
  console.log(`   👥 ${COLLABORATORS.length} collaborators (1 inactive)`);
  console.log(`   📋 ${ROLE_PROFILES.length} role profiles`);
  console.log(`   📅 ${totalSessions} evaluation sessions`);
  console.log(`   📊 ${totalAssessments} assessments`);
  console.log(`   ${violations === 0 ? '✅' : '❌'} ${violations} rule violations`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
