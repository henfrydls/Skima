import { Router } from 'express';
import { prisma } from '../db.js';
import {
  CATEGORIES,
  SKILLS,
  COLLABORATORS,
  ROLE_PROFILES,
  generateSnapshots,
} from '../data/seedData.js';

const router = Router();

// ============================================================
// POST /api/seed-demo - Seed rich demo data for first-time experience
// Uses the same chaos testing dataset as prisma/seed.js
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
    for (const cat of CATEGORIES) {
      await prisma.category.create({ data: cat });
    }

    // Create skills
    for (const skill of SKILLS) {
      await prisma.skill.create({ data: skill });
    }

    // Create collaborators
    for (const collab of COLLABORATORS) {
      await prisma.collaborator.create({ data: collab });
    }

    // Create role profiles
    for (const profile of ROLE_PROFILES) {
      await prisma.roleProfile.upsert({
        where: { rol: profile.rol },
        update: { skills: profile.skills },
        create: profile,
      });
    }

    // Generate evaluation snapshots
    const snapshots = generateSnapshots();
    const allAssessments = [];

    // Create evaluation sessions individually (need IDs for assessments)
    for (const snapshot of snapshots) {
      const { collaboratorId, date, rol, skills, rolChanged } = snapshot;
      const collab = COLLABORATORS.find(c => c.id === collaboratorId);

      const session = await prisma.evaluationSession.create({
        data: {
          collaboratorId,
          collaboratorNombre: collab.nombre,
          collaboratorRol: rol,
          evaluatedBy: 'Demo',
          notes: rolChanged ? 'Cambio de rol detectado' : `Evaluacion ${date}`,
          evaluatedAt: new Date(date),
        },
      });

      // Collect assessments for batch insert
      for (const [skillId, data] of Object.entries(skills)) {
        allAssessments.push({
          collaboratorId,
          skillId: parseInt(skillId),
          nivel: data.nivel,
          criticidad: data.criticidad,
          frecuencia: data.frecuencia,
          evaluationSessionId: session.id,
          createdAt: new Date(date),
        });
      }
    }

    // Batch-create all assessments (much faster than individual creates)
    await prisma.assessment.createMany({ data: allAssessments });

    // Update lastEvaluated for each collaborator
    for (const collab of COLLABORATORS) {
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
        categories: CATEGORIES.length,
        skills: SKILLS.length,
        collaborators: COLLABORATORS.length,
        roleProfiles: ROLE_PROFILES.length,
        evaluationSessions: snapshots.length,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/seed-demo failed:', error);
    res.status(500).json({ error: 'Error al crear datos demo' });
  }
});

export default router;
