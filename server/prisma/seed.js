/**
 * CHAOS TESTING SEED V3 - 10 Edge Case Archetypes
 *
 * Run with: npm run db:seed
 *
 * Data and generation logic imported from src/data/seedData.js
 * (shared with the demo route)
 */

import { PrismaClient } from '@prisma/client';
import {
  CATEGORIES,
  SKILLS,
  COLLABORATORS,
  ROLE_PROFILES,
  generateSnapshots,
} from '../src/data/seedData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('CHAOS TESTING SEED V3');
  console.log('');
  console.log('10 Archetypes for Edge Case Testing:');
  console.log('   Lucia One-Shot (1 evaluation)');
  console.log('   Ana (UX -> Product Owner)');
  console.log('   Roberto (Inactive/Resigned)');
  console.log('   Juana Contractor (No Profile)');
  console.log('   Luis Burnout (Negative Trend)');
  console.log('   Don Pedro (Legacy Expert)');
  console.log('   Sofia (Reference Baseline)');
  console.log('   Carmen (Rising Star)');
  console.log('   Carlos (Growth Champion)');
  console.log('   Miguel (Gap Resolution)');
  console.log('');

  console.log('  Clearing ALL existing data...');
  await prisma.developmentAction.deleteMany();
  await prisma.developmentGoal.deleteMany();
  await prisma.developmentPlan.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.evaluationSession.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
  await prisma.roleProfile.deleteMany();

  // Reset SystemConfig so setup wizard shows on next launch
  await prisma.systemConfig.deleteMany();
  console.log('  SystemConfig reset (setup wizard will show on next launch)');

  console.log('  Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.create({ data: cat });
  }

  console.log('  Seeding skills...');
  for (const skill of SKILLS) {
    await prisma.skill.create({ data: skill });
  }

  console.log('  Seeding collaborators...');
  for (const collab of COLLABORATORS) {
    await prisma.collaborator.create({ data: collab });
  }

  console.log('  Seeding role profiles...');
  for (const profile of ROLE_PROFILES) {
    await prisma.roleProfile.upsert({
      where: { rol: profile.rol },
      update: { skills: profile.skills },
      create: profile
    });
  }

  console.log('  Generating chaos test history...');
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
        notes: rolChanged ? 'Cambio de rol detectado' : `Evaluacion ${date}`,
        evaluatedAt: new Date(date)
      }
    });
    totalSessions++;

    for (const [skillId, data] of Object.entries(skills)) {
      // Violation checks
      if (data.criticidad === 'N') {
        if (data.nivel > 0) {
          console.warn(`  VIOLATION: Skill ${skillId} has N/A criticidad but nivel=${data.nivel}`);
          violations++;
        }
        if (data.frecuencia !== 'N') {
          console.warn(`  VIOLATION: Skill ${skillId} has N/A criticidad but frecuencia=${data.frecuencia}`);
          violations++;
        }
      }
      if (data.criticidad !== 'N' && data.frecuencia === 'N') {
        console.warn(`  VIOLATION: Skill ${skillId} has criticidad=${data.criticidad} but frecuencia=N`);
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

  console.log('  Updating lastEvaluated timestamps...');
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

  // ============================================
  // INDIVIDUAL DEVELOPMENT PLANS (IDPs)
  // ============================================
  console.log('  Seeding development plans (IDPs)...');

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Plan 1: Sofia (208) - "Q2 2026 Growth Plan" (active, 2 goals)
  const sofiaPlan = await prisma.developmentPlan.create({
    data: {
      collaboratorId: 208,
      title: 'Q2 2026 Growth Plan',
      status: 'active',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      goals: {
        create: [
          {
            title: 'Improve testing skills',
            skillId: 14, // Testing/QA
            currentLevel: 2.5,
            targetLevel: 4.0,
            priority: 1,
            status: 'in_progress',
            sortOrder: 0,
            actions: {
              create: [
                {
                  title: 'Complete "Testing JavaScript Applications" course on Udemy',
                  actionType: 'formal',
                  status: 'completed',
                  completedAt: new Date('2026-03-20'),
                  evidence: 'Certificate uploaded to learning portal',
                  sortOrder: 0,
                },
                {
                  title: 'Pair-program with QA lead on integration test suite',
                  actionType: 'social',
                  status: 'in_progress',
                  dueDate: new Date('2026-05-15'),
                  sortOrder: 1,
                },
                {
                  title: 'Write test suite for the new payments module',
                  actionType: 'experience',
                  status: 'not_started',
                  dueDate: new Date('2026-06-15'),
                  sortOrder: 2,
                },
              ],
            },
          },
          {
            title: 'Develop architecture skills',
            skillId: null, // No skill link
            priority: 2,
            status: 'not_started',
            sortOrder: 1,
            actions: {
              create: [
                {
                  title: 'Read "Fundamentals of Software Architecture" by Richards & Ford',
                  actionType: 'self_directed',
                  status: 'not_started',
                  dueDate: new Date('2026-05-31'),
                  sortOrder: 0,
                },
                {
                  title: 'Lead architecture review for upcoming microservices migration',
                  actionType: 'experience',
                  status: 'not_started',
                  dueDate: new Date('2026-06-30'),
                  sortOrder: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Plan 2: Carmen (209) - "Frontend Mastery Plan" (active, 1 goal)
  const carmenPlan = await prisma.developmentPlan.create({
    data: {
      collaboratorId: 209,
      title: 'Frontend Mastery Plan',
      status: 'active',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-06-30'),
      goals: {
        create: [
          {
            title: 'Master React advanced patterns',
            skillId: 10, // Frontend Development
            currentLevel: 3.0,
            targetLevel: 4.5,
            priority: 1,
            status: 'in_progress',
            sortOrder: 0,
            actions: {
              create: [
                {
                  title: 'Complete Epic React workshop by Kent C. Dodds',
                  actionType: 'formal',
                  status: 'completed',
                  completedAt: new Date('2026-03-15'),
                  evidence: 'Workshop completion certificate',
                  sortOrder: 0,
                },
                {
                  title: 'Study and document React Server Components patterns',
                  actionType: 'self_directed',
                  status: 'completed',
                  completedAt: new Date('2026-03-25'),
                  evidence: 'Internal wiki article published',
                  sortOrder: 1,
                },
                {
                  title: 'Refactor dashboard module using compound component pattern',
                  actionType: 'experience',
                  status: 'in_progress',
                  dueDate: new Date('2026-05-30'),
                  sortOrder: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Plan 3: Miguel (211) - "Completed Cloud Skills Plan" (completed)
  const miguelPlan = await prisma.developmentPlan.create({
    data: {
      collaboratorId: 211,
      title: 'Completed Cloud Skills Plan',
      status: 'completed',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-02-28'),
      completedAt: oneMonthAgo,
      goals: {
        create: [
          {
            title: 'Improve cloud skills',
            skillId: 7, // Cloud Infrastructure & DevOps
            currentLevel: 2.0,
            targetLevel: 3.5,
            priority: 1,
            status: 'completed',
            completedAt: oneMonthAgo,
            sortOrder: 0,
            actions: {
              create: [
                {
                  title: 'Complete AWS Cloud Practitioner certification',
                  actionType: 'formal',
                  status: 'completed',
                  completedAt: new Date('2026-01-20'),
                  evidence: 'AWS certification badge verified',
                  sortOrder: 0,
                },
                {
                  title: 'Shadow DevOps team during production deployment',
                  actionType: 'social',
                  status: 'completed',
                  completedAt: new Date('2026-02-10'),
                  evidence: 'Deployment log and team feedback collected',
                  sortOrder: 1,
                },
                {
                  title: 'Set up CI/CD pipeline for personal project',
                  actionType: 'experience',
                  status: 'completed',
                  completedAt: new Date('2026-02-25'),
                  evidence: 'GitHub repo with working pipeline: github.com/miguel/demo-cicd',
                  sortOrder: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const totalPlans = 3;
  const totalGoals = 4;
  const totalActions = 8;
  console.log(`   ${totalPlans} development plans`);
  console.log(`   ${totalGoals} development goals`);
  console.log(`   ${totalActions} development actions`);

  console.log('');
  console.log('CHAOS TESTING SEED V3 completed!');
  console.log(`   ${CATEGORIES.length} categories (1 inactive)`);
  console.log(`   ${SKILLS.length} skills (2 legacy)`);
  console.log(`   ${COLLABORATORS.length} collaborators (1 inactive)`);
  console.log(`   ${ROLE_PROFILES.length} role profiles`);
  console.log(`   ${totalSessions} evaluation sessions`);
  console.log(`   ${totalAssessments} assessments`);
  console.log(`   ${totalPlans} development plans (IDPs)`);
  console.log(`   ${violations === 0 ? 'OK' : 'FAIL'} ${violations} rule violations`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
