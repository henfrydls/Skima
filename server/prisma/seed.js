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

  console.log('');
  console.log('CHAOS TESTING SEED V3 completed!');
  console.log(`   ${CATEGORIES.length} categories (1 inactive)`);
  console.log(`   ${SKILLS.length} skills (2 legacy)`);
  console.log(`   ${COLLABORATORS.length} collaborators (1 inactive)`);
  console.log(`   ${ROLE_PROFILES.length} role profiles`);
  console.log(`   ${totalSessions} evaluation sessions`);
  console.log(`   ${totalAssessments} assessments`);
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
