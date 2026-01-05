import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for the entire app
export const prisma = new PrismaClient();
