import { Router } from 'express';
import bcrypt from 'bcryptjs';
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
    // Wrap entire seed operation in transaction for atomicity
    const snapshotCount = await prisma.$transaction(async (tx) => {
      // Clear any existing data before seeding (idempotent)
      await tx.developmentAction.deleteMany();
      await tx.developmentGoal.deleteMany();
      await tx.developmentPlan.deleteMany();
      await tx.assessment.deleteMany();
      await tx.evaluationSession.deleteMany();
      await tx.collaborator.deleteMany();
      await tx.skill.deleteMany();
      await tx.category.deleteMany();
      await tx.roleProfile.deleteMany();

      // Create categories
      for (const cat of CATEGORIES) {
        await tx.category.create({ data: cat });
      }

      // Create skills
      for (const skill of SKILLS) {
        await tx.skill.create({ data: skill });
      }

      // Create collaborators
      for (const collab of COLLABORATORS) {
        await tx.collaborator.create({ data: collab });
      }

      // Create role profiles
      for (const profile of ROLE_PROFILES) {
        await tx.roleProfile.upsert({
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

        const session = await tx.evaluationSession.create({
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
      await tx.assessment.createMany({ data: allAssessments });

      // Update lastEvaluated for each collaborator
      for (const collab of COLLABORATORS) {
        const lastSession = await tx.evaluationSession.findFirst({
          where: { collaboratorId: collab.id },
          orderBy: { evaluatedAt: 'desc' },
        });
        if (lastSession) {
          await tx.collaborator.update({
            where: { id: collab.id },
            data: { lastEvaluated: lastSession.evaluatedAt },
          });
        }
      }

      // Set up SystemConfig as demo (password: admin123)
      const demoPassword = await bcrypt.hash('admin123', 10);
      await tx.systemConfig.upsert({
        where: { id: 1 },
        update: {
          companyName: 'Demo Company',
          adminName: 'Administrator',
          adminPassword: demoPassword,
          isSetup: true,
        },
        create: {
          id: 1,
          companyName: 'Demo Company',
          adminName: 'Administrator',
          adminPassword: demoPassword,
          isSetup: true,
        },
      });

      // ── IDP Seed Data ──────────────────────────────────────
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Plan 1: Active growth plan for Sofia Martinez (Tech Lead, id=208)
      const plan1 = await tx.developmentPlan.create({
        data: {
          collaboratorId: 208,
          title: 'Q2 2026 Growth Plan',
          description: 'Focused on improving testing and architecture skills for senior tech lead readiness.',
          targetRole: 'Tech Lead',
          status: 'active',
          startDate: oneMonthAgo,
          endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      });

      // Goal 1: Improve testing skills (skill 14 = Testing/QA)
      const goal1 = await tx.developmentGoal.create({
        data: {
          planId: plan1.id,
          title: 'Improve testing skills',
          description: 'Reach advanced testing proficiency to lead QA initiatives.',
          skillId: 14,
          currentLevel: 2.1,
          targetLevel: 4.0,
          priority: 1,
          status: 'in_progress',
          sortOrder: 0,
        },
      });

      await tx.developmentAction.createMany({
        data: [
          {
            goalId: goal1.id,
            title: 'Complete testing course',
            description: 'Finish "Testing JavaScript Applications" on Frontend Masters.',
            actionType: 'formal',
            status: 'completed',
            completedAt: twoWeeksAgo,
            sortOrder: 0,
          },
          {
            goalId: goal1.id,
            title: 'Mentor junior on tests',
            description: 'Pair-program with Carmen on writing integration tests.',
            actionType: 'social',
            status: 'in_progress',
            sortOrder: 1,
          },
          {
            goalId: goal1.id,
            title: 'Lead test coverage sprint',
            description: 'Own and drive the Q2 test coverage improvement sprint.',
            actionType: 'experience',
            status: 'not_started',
            sortOrder: 2,
          },
        ],
      });

      // Goal 2: Develop architecture skills (no skill link)
      const goal2 = await tx.developmentGoal.create({
        data: {
          planId: plan1.id,
          title: 'Develop architecture skills',
          description: 'Build system design expertise for future architect role.',
          priority: 2,
          status: 'not_started',
          sortOrder: 1,
        },
      });

      await tx.developmentAction.createMany({
        data: [
          {
            goalId: goal2.id,
            title: 'Read Clean Architecture book',
            description: 'Complete Robert C. Martin\'s Clean Architecture.',
            actionType: 'self_directed',
            status: 'completed',
            completedAt: twoWeeksAgo,
            sortOrder: 0,
          },
          {
            goalId: goal2.id,
            title: 'Design module decomposition',
            description: 'Propose architecture for decomposing the dashboard monolith.',
            actionType: 'experience',
            status: 'not_started',
            sortOrder: 1,
          },
        ],
      });

      // Plan 2: Completed plan for Carlos Mejia (UX Designer, id=210)
      const plan2 = await tx.developmentPlan.create({
        data: {
          collaboratorId: 210,
          title: 'Completed Growth Plan',
          description: 'SQL and data skills improvement plan, successfully completed.',
          status: 'completed',
          startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          completedAt: oneMonthAgo,
        },
      });

      // Goal: Improve SQL skills (skill 21 = Data Analytics)
      const goal3 = await tx.developmentGoal.create({
        data: {
          planId: plan2.id,
          title: 'Improve SQL skills',
          description: 'Reach intermediate data analytics proficiency.',
          skillId: 21,
          currentLevel: 1.5,
          targetLevel: 3.0,
          priority: 1,
          status: 'completed',
          completedAt: oneMonthAgo,
          sortOrder: 0,
        },
      });

      await tx.developmentAction.createMany({
        data: [
          {
            goalId: goal3.id,
            title: 'Complete SQL course',
            description: 'Finish "SQL for Data Analysis" on Coursera.',
            actionType: 'formal',
            status: 'completed',
            completedAt: new Date(oneMonthAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
            sortOrder: 0,
          },
          {
            goalId: goal3.id,
            title: 'Optimize 3 slow queries',
            description: 'Identify and optimize the top 3 slowest dashboard queries.',
            actionType: 'experience',
            status: 'completed',
            completedAt: oneMonthAgo,
            sortOrder: 1,
          },
        ],
      });

      return snapshots.length;
    }, { timeout: 30000 });

    res.json({
      success: true,
      isSetup: true,
      companyName: 'Demo Company',
      adminName: 'Administrator',
      stats: {
        categories: CATEGORIES.length,
        skills: SKILLS.length,
        collaborators: COLLABORATORS.length,
        roleProfiles: ROLE_PROFILES.length,
        evaluationSessions: snapshotCount,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/seed-demo failed:', error);
    res.status(500).json({ error: 'Error creating demo data' });
  }
});

export default router;
