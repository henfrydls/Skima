import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// ============================================================
// DEMO DATA - Minimal dataset to showcase the app
// ============================================================

const DEMO_CATEGORIES = [
  { id: 1, nombre: 'Desarrollo & Plataforma', abrev: 'Desarrollo', orden: 0 },
  { id: 2, nombre: 'Diseño & Producto', abrev: 'Diseño', orden: 1 },
  { id: 3, nombre: 'Liderazgo & Gestión', abrev: 'Liderazgo', orden: 2 },
  { id: 4, nombre: 'Datos & Análisis', abrev: 'Datos', orden: 3 },
];

const DEMO_SKILLS = [
  // Desarrollo
  { id: 1, categoriaId: 1, nombre: 'Frontend Development' },
  { id: 2, categoriaId: 1, nombre: 'Backend Development' },
  { id: 3, categoriaId: 1, nombre: 'Cloud & DevOps' },
  { id: 4, categoriaId: 1, nombre: 'Testing & QA' },
  // Diseño
  { id: 5, categoriaId: 2, nombre: 'UX/UI Design' },
  { id: 6, categoriaId: 2, nombre: 'User Research' },
  { id: 7, categoriaId: 2, nombre: 'Product Management' },
  // Liderazgo
  { id: 8, categoriaId: 3, nombre: 'Project Management' },
  { id: 9, categoriaId: 3, nombre: 'Communication' },
  { id: 10, categoriaId: 3, nombre: 'Team Leadership' },
  // Datos
  { id: 11, categoriaId: 4, nombre: 'Data Analytics' },
  { id: 12, categoriaId: 4, nombre: 'Business Intelligence' },
];

const DEMO_COLLABORATORS = [
  { id: 101, nombre: 'María García', rol: 'Full Stack Developer', esDemo: true, isActive: true },
  { id: 102, nombre: 'Carlos Pérez', rol: 'UX Designer', esDemo: true, isActive: true },
  { id: 103, nombre: 'Laura Méndez', rol: 'Tech Lead', esDemo: true, isActive: true },
  { id: 104, nombre: 'Roberto Díaz', rol: 'Data Analyst', esDemo: true, isActive: true },
];

const DEMO_ROLE_PROFILES = [
  {
    rol: 'Full Stack Developer',
    skills: JSON.stringify({
      "1": "C", "2": "C", "3": "I", "4": "C",
      "5": "D", "6": "D", "7": "D",
      "8": "I", "9": "I", "10": "D",
      "11": "D", "12": "D"
    })
  },
  {
    rol: 'UX Designer',
    skills: JSON.stringify({
      "1": "I", "2": "D", "3": "D", "4": "D",
      "5": "C", "6": "C", "7": "C",
      "8": "I", "9": "C", "10": "D",
      "11": "I", "12": "D"
    })
  },
  {
    rol: 'Tech Lead',
    skills: JSON.stringify({
      "1": "C", "2": "C", "3": "C", "4": "I",
      "5": "D", "6": "D", "7": "I",
      "8": "C", "9": "C", "10": "C",
      "11": "I", "12": "D"
    })
  },
  {
    rol: 'Data Analyst',
    skills: JSON.stringify({
      "1": "D", "2": "I", "3": "D", "4": "D",
      "5": "D", "6": "I", "7": "I",
      "8": "I", "9": "I", "10": "D",
      "11": "C", "12": "C"
    })
  },
];

// Generate evaluations with realistic variation
function generateDemoEvaluations() {
  const now = new Date();
  const sessions = [];

  // Helper: clamp value between min and max
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const round1 = (v) => Math.round(v * 10) / 10;

  // María - strong developer, improving over 3 periods
  const mariaBase = [
    { "1": 4.2, "2": 3.8, "3": 3.0, "4": 3.5, "5": 2.0, "6": 1.5, "7": 2.0, "8": 2.5, "9": 3.0, "10": 2.0, "11": 2.5, "12": 1.5 },
    { "1": 4.5, "2": 4.0, "3": 3.3, "4": 3.8, "5": 2.2, "6": 1.8, "7": 2.2, "8": 2.8, "9": 3.2, "10": 2.2, "11": 2.8, "12": 1.8 },
    { "1": 4.8, "2": 4.3, "3": 3.6, "4": 4.0, "5": 2.5, "6": 2.0, "7": 2.5, "8": 3.0, "9": 3.5, "10": 2.5, "11": 3.0, "12": 2.0 },
  ];

  // Carlos - strong designer, steady
  const carlosBase = [
    { "1": 2.5, "2": 1.5, "3": 1.0, "4": 1.5, "5": 4.5, "6": 4.0, "7": 3.5, "8": 3.0, "9": 4.0, "10": 2.5, "11": 3.0, "12": 2.0 },
    { "1": 2.8, "2": 1.8, "3": 1.2, "4": 1.8, "5": 4.6, "6": 4.2, "7": 3.8, "8": 3.2, "9": 4.2, "10": 2.8, "11": 3.2, "12": 2.2 },
    { "1": 3.0, "2": 2.0, "3": 1.5, "4": 2.0, "5": 4.8, "6": 4.5, "7": 4.0, "8": 3.5, "9": 4.5, "10": 3.0, "11": 3.5, "12": 2.5 },
  ];

  // Laura - well-rounded leader, critical gaps in some areas
  const lauraBase = [
    { "1": 4.0, "2": 4.0, "3": 3.8, "4": 3.5, "5": 2.5, "6": 2.0, "7": 3.0, "8": 4.0, "9": 4.2, "10": 4.0, "11": 3.0, "12": 2.0 },
    { "1": 4.2, "2": 4.2, "3": 4.0, "4": 3.8, "5": 2.8, "6": 2.3, "7": 3.2, "8": 4.2, "9": 4.3, "10": 4.2, "11": 3.2, "12": 2.3 },
    { "1": 4.5, "2": 4.5, "3": 4.2, "4": 4.0, "5": 3.0, "6": 2.5, "7": 3.5, "8": 4.5, "9": 4.5, "10": 4.5, "11": 3.5, "12": 2.5 },
  ];

  // Roberto - data specialist, growing
  const robertoBase = [
    { "1": 2.0, "2": 2.5, "3": 1.5, "4": 1.5, "5": 2.0, "6": 3.0, "7": 3.0, "8": 2.5, "9": 3.0, "10": 2.0, "11": 4.0, "12": 3.8 },
    { "1": 2.3, "2": 2.8, "3": 1.8, "4": 1.8, "5": 2.2, "6": 3.2, "7": 3.2, "8": 2.8, "9": 3.2, "10": 2.2, "11": 4.3, "12": 4.0 },
    { "1": 2.5, "2": 3.0, "3": 2.0, "4": 2.0, "5": 2.5, "6": 3.5, "7": 3.5, "8": 3.0, "9": 3.5, "10": 2.5, "11": 4.5, "12": 4.2 },
  ];

  const allData = [
    { collaboratorId: 101, nombre: 'María García', rol: 'Full Stack Developer', levels: mariaBase },
    { collaboratorId: 102, nombre: 'Carlos Pérez', rol: 'UX Designer', levels: carlosBase },
    { collaboratorId: 103, nombre: 'Laura Méndez', rol: 'Tech Lead', levels: lauraBase },
    { collaboratorId: 104, nombre: 'Roberto Díaz', rol: 'Data Analyst', levels: robertoBase },
  ];

  // 3 evaluation periods: 6 months ago, 3 months ago, now
  const dates = [
    new Date(now.getFullYear(), now.getMonth() - 6, 15),
    new Date(now.getFullYear(), now.getMonth() - 3, 15),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ];

  const freqForLevel = (nivel) => {
    if (nivel <= 0) return 'N';
    if (nivel >= 4) return 'D';
    if (nivel >= 3) return 'S';
    if (nivel >= 2) return 'M';
    return 'T';
  };

  for (const { collaboratorId, nombre, rol, levels } of allData) {
    for (let i = 0; i < 3; i++) {
      const profile = DEMO_ROLE_PROFILES.find(p => p.rol === rol);
      const profileSkills = profile ? JSON.parse(profile.skills) : {};

      const assessments = [];
      for (const [skillId, nivel] of Object.entries(levels[i])) {
        const criticidad = profileSkills[skillId] || 'N';
        const clampedNivel = round1(clamp(nivel, 0, 5));
        assessments.push({
          skillId: parseInt(skillId),
          nivel: clampedNivel,
          criticidad,
          frecuencia: criticidad === 'N' ? 'N' : freqForLevel(clampedNivel),
        });
      }

      sessions.push({
        collaboratorId,
        collaboratorNombre: nombre,
        collaboratorRol: rol,
        evaluatedBy: 'Demo',
        notes: `Evaluación demo - Período ${i + 1}`,
        evaluatedAt: dates[i],
        assessments,
      });
    }
  }

  return sessions;
}

// ============================================================
// POST /api/seed-demo - Seed demo data for first-time experience
// ============================================================
router.post('/', async (req, res) => {
  try {
    // Check if data already exists
    const existingCollabs = await prisma.collaborator.count();
    if (existingCollabs > 0) {
      return res.status(409).json({
        error: 'Ya existen datos. Usa "Limpiar datos demo" primero.'
      });
    }

    // Create categories
    for (const cat of DEMO_CATEGORIES) {
      await prisma.category.create({ data: cat });
    }

    // Create skills
    for (const skill of DEMO_SKILLS) {
      await prisma.skill.create({ data: skill });
    }

    // Create collaborators
    for (const collab of DEMO_COLLABORATORS) {
      await prisma.collaborator.create({ data: collab });
    }

    // Create role profiles
    for (const profile of DEMO_ROLE_PROFILES) {
      await prisma.roleProfile.upsert({
        where: { rol: profile.rol },
        update: { skills: profile.skills },
        create: profile,
      });
    }

    // Create evaluation sessions with assessments
    const sessions = generateDemoEvaluations();
    for (const session of sessions) {
      const { assessments, ...sessionData } = session;
      const created = await prisma.evaluationSession.create({ data: sessionData });

      for (const assessment of assessments) {
        await prisma.assessment.create({
          data: {
            ...assessment,
            collaboratorId: session.collaboratorId,
            evaluationSessionId: created.id,
            createdAt: session.evaluatedAt,
          },
        });
      }
    }

    // Update lastEvaluated for each collaborator
    for (const collab of DEMO_COLLABORATORS) {
      const lastSession = await prisma.evaluationSession.findFirst({
        where: { collaboratorId: collab.id },
        orderBy: { evaluatedAt: 'desc' },
      });
      if (lastSession) {
        await prisma.collaborator.update({
          where: { id: collab.id },
          data: { lastEvaluated: lastSession.evaluatedAt },
        });
      }
    }

    // Set up SystemConfig as demo
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {
        companyName: 'Empresa Demo',
        adminName: 'Administrador',
        isSetup: true,
      },
      create: {
        id: 1,
        companyName: 'Empresa Demo',
        adminName: 'Administrador',
        isSetup: true,
      },
    });

    res.json({
      success: true,
      isSetup: true,
      companyName: 'Empresa Demo',
      adminName: 'Administrador',
      stats: {
        categories: DEMO_CATEGORIES.length,
        skills: DEMO_SKILLS.length,
        collaborators: DEMO_COLLABORATORS.length,
        roleProfiles: DEMO_ROLE_PROFILES.length,
        evaluationSessions: sessions.length,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/seed-demo failed:', error);
    res.status(500).json({ error: 'Error al crear datos demo' });
  }
});

export default router;
