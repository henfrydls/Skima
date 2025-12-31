import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../index.js';

// Clean database before each test
beforeEach(async () => {
  // Delete in order due to foreign key constraints
  // Assessment references: Collaborator, Skill, Snapshot, EvaluationSession
  await prisma.assessment.deleteMany();
  // EvaluationSession references: Collaborator
  await prisma.evaluationSession.deleteMany();
  // RoleProfile has no FK dependencies
  await prisma.roleProfile.deleteMany();
  // Snapshot has no FK dependencies (Assessments already deleted)
  await prisma.snapshot.deleteMany();
  // Collaborator has no FK dependencies (Assessments/EvaluationSessions already deleted)
  await prisma.collaborator.deleteMany();
  // Skill references: Category
  await prisma.skill.deleteMany();
  // Category has no FK dependencies (Skills already deleted)
  await prisma.category.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
