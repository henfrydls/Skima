import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../index.js';

// Clean database before each test
beforeEach(async () => {
  // Delete in order due to foreign key constraints
  await prisma.assessment.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
  await prisma.snapshot.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
