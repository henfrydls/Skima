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
// COLLABORATORS (8 Archetypes)
// ============================================
const COLLABORATORS = [
  { id: 201, nombre: 'Lucía Fernández', rol: 'Frontend Developer', esDemo: true, isActive: true },
  { id: 202, nombre: 'Ana Rodríguez', rol: 'Product Owner', esDemo: true, isActive: true },
  { id: 203, nombre: 'Miguel Ángel Torres', rol: 'Tech Lead', esDemo: true, isActive: true },
  { id: 204, nombre: 'Roberto Fantasma', rol: 'Backend Developer', esDemo: true, isActive: false },
  { id: 205, nombre: 'Juana Díaz', rol: 'External Consultant', esDemo: true, isActive: true },
  { id: 206, nombre: 'Luis Hernández', rol: 'Backend Developer', esDemo: true, isActive: true },
  { id: 207, nombre: 'Pedro Rosario', rol: 'Innovation Specialist', esDemo: true, isActive: true },
  { id: 208, nombre: 'Sofía Martínez', rol: 'Tech Lead', esDemo: true, isActive: true },
];

// ============================================
// ROLE PROFILES
// ============================================
const ROLE_PROFILES = [
  { rol: 'Frontend Developer', skills: JSON.stringify({ "10": "C", "36": "C", "40": "C", "9": "I", "11": "I", "14": "I" }) },
  { rol: 'Backend Developer', skills: JSON.stringify({ "9": "C", "8": "C", "7": "I", "11": "C", "14": "I", "40": "C" }) },
  { rol: 'Tech Lead', skills: JSON.stringify({ "8": "C", "9": "C", "15": "C", "16": "I", "18": "C", "33": "C", "40": "C" }) },
  { rol: 'UX Designer', skills: JSON.stringify({ "1": "C", "2": "C", "4": "C", "36": "C", "5": "I", "18": "I" }) },
  { rol: 'Product Owner', skills: JSON.stringify({ "34": "C", "31": "C", "29": "C", "19": "I", "23": "I", "25": "I" }) },
  { rol: 'Innovation Specialist', skills: JSON.stringify({ "97": "C", "98": "C", "8": "I" }) },
  { rol: 'Security Guard', skills: JSON.stringify({}) }, // No one has this role
  // NOTE: 'External Consultant' is NOT here (undefined profile)
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

// ============================================
// GENERATE SNAPSHOTS
// ============================================
const generateSnapshots = () => {
  const snapshots = [];
  
  // 🆕 1. LUCÍA - Only Dec 2025
  snapshots.push({ collaboratorId: 201, date: '2025-12-31', rol: 'Frontend Developer', skills: generateSkillSet(3.0, { highSkills: [10, 36, 40] }) });

  // 🔀 2. ANA - 18 months UX, then PO
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31', '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31'].forEach(date => {
    snapshots.push({ collaboratorId: 202, date, rol: 'UX Designer', skills: generateSkillSet(4.2, { highSkills: [1, 2, 4, 36] }) });
  });
  snapshots.push({ collaboratorId: 202, date: '2025-12-31', rol: 'Product Owner', rolChanged: true, skills: generateSkillSet(3.0, { highSkills: [34, 31, 29] }) });

  // 🔀 3. MIGUEL - 2 years Backend, then Tech Lead
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31', '2025-02-28', '2025-04-30', '2025-06-30', '2025-08-31', '2025-10-31'].forEach(date => {
    snapshots.push({ collaboratorId: 203, date, rol: 'Backend Developer', skills: generateSkillSet(4.0, { highSkills: [9, 8, 7, 40] }) });
  });
  snapshots.push({ collaboratorId: 203, date: '2025-12-31', rol: 'Tech Lead', rolChanged: true, skills: generateSkillSet(3.2, { highSkills: [9, 8], lowSkills: [15, 16, 17, 18] }) });

  // 💀 4. ROBERTO - Only 2024 (resigned Jan 2025)
  ['2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31'].forEach(date => {
    snapshots.push({ collaboratorId: 204, date, rol: 'Backend Developer', skills: generateSkillSet(3.5) });
  });

  // 👻 5. CONTRACTOR - Sporadic, no profile
  const naSkills = [...SKILL_IDS.INNOVATION, ...SKILL_IDS.LEADERSHIP, ...SKILL_IDS.DELIVERY];
  ['2024-06-30', '2025-04-30', '2025-12-31'].forEach(date => {
    snapshots.push({ collaboratorId: 205, date, rol: 'External Consultant', skills: generateSkillSet(3.5, { isContractor: true, naSkills }) });
  });

  // 📉 6. LUIS - Burnout trend
  const luisTrend = [3.8, 4.0, 4.0, 3.9, 3.6, 3.3, 3.0, 2.7, 2.4, 2.2];
  SNAPSHOT_DATES.forEach((date, idx) => {
    const skills = generateSkillSet(luisTrend[idx], { lowSkills: idx >= 6 ? SKILL_IDS.LEADERSHIP : [] });
    if (idx >= 6) {
      skills[15] = { nivel: 1.5, frecuencia: 'M', criticidad: 'C' };
      skills[16] = { nivel: 1.2, frecuencia: 'M', criticidad: 'C' };
      skills[18] = { nivel: 1.3, frecuencia: 'S', criticidad: 'C' };
    }
    snapshots.push({ collaboratorId: 206, date, rol: 'Backend Developer', skills });
  });

  // 🦕 7. DON PEDRO - Legacy expert
  SNAPSHOT_DATES.forEach(date => {
    const skills = generateSkillSet(3.0, { includeLegacy: true });
    skills[97] = { nivel: 5.0, frecuencia: 'D', criticidad: 'C' };
    skills[98] = { nivel: 4.8, frecuencia: 'D', criticidad: 'C' };
    skills[35] = { nivel: 0.5, frecuencia: 'N', criticidad: 'N' };
    skills[38] = { nivel: 0, frecuencia: 'N', criticidad: 'N' };
    snapshots.push({ collaboratorId: 207, date, rol: 'Innovation Specialist', skills });
  });

  // 🌟 8. SOFÍA - Perfect reference
  SNAPSHOT_DATES.forEach(date => {
    snapshots.push({ collaboratorId: 208, date, rol: 'Tech Lead', skills: generateSkillSet(4.3, { variation: 0.15, highSkills: [7, 8, 9, 15, 16, 40] }) });
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
        evaluatedBy: 'Sistema (Chaos Seed)',
        notes: rolChanged ? '🔀 Cambio de rol detectado' : `Evaluación ${date}`,
        evaluatedAt: new Date(date)
      }
    });
    totalSessions++;

    for (const [skillId, data] of Object.entries(skills)) {
      if ((data.criticidad === 'C' || data.criticidad === 'I') && data.frecuencia === 'N') {
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
