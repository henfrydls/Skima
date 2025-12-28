import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // ============================================================
  // API ROUTES
  // ============================================================

  // GET /api/data - Aggregated data for Dashboard (backwards compatible)
  app.get('/api/data', async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { id: 'asc' }
      });

      const skills = await prisma.skill.findMany({
        orderBy: { id: 'asc' }
      });

      const collaboratorsRaw = await prisma.collaborator.findMany({
        include: {
          assessments: {
            where: { snapshotId: null } // Current (not archived) assessments
          }
        }
      });

      // Transform to match frontend expected format
      const collaborators = collaboratorsRaw.map(col => {
        const skillsMap = {};
        col.assessments.forEach(a => {
          skillsMap[a.skillId] = {
            nivel: a.nivel,
            criticidad: a.criticidad,
            frecuencia: a.frecuencia
          };
        });
        return {
          id: col.id,
          nombre: col.nombre,
          rol: col.rol,
          esDemo: col.esDemo,
          skills: skillsMap
        };
      });

      // Check if there are any demo collaborators
      const hasDemo = collaborators.some(c => c.esDemo);

      res.json({
        categories: categories.map(c => ({
          id: c.id,
          nombre: c.nombre,
          abrev: c.abrev,
          skillCount: skills.filter(s => s.categoriaId === c.id).length
        })),
        skills: skills.map(s => ({
          id: s.id,
          categoria: s.categoriaId,
          nombre: s.nombre
        })),
        collaborators,
        allowResetFromDemo: hasDemo
      });
    } catch (error) {
      console.error('[API] GET /api/data failed:', error);
      res.status(500).json({ message: 'Error reading data' });
    }
  });

  // POST /api/collaborators - Add new collaborator
  app.post('/api/collaborators', async (req, res) => {
    try {
      const { nombre, rol, skills, esDemo = false } = req.body;

      if (!nombre || !rol) {
        return res.status(400).json({ message: 'Nombre y rol son requeridos' });
      }

      const collaborator = await prisma.collaborator.create({
        data: {
          nombre,
          rol,
          esDemo
        }
      });

      // Create assessments for each skill
      if (skills && typeof skills === 'object') {
        const assessmentData = Object.entries(skills).map(([skillId, data]) => ({
          collaboratorId: collaborator.id,
          skillId: parseInt(skillId),
          nivel: parseFloat(data.nivel) || 0,
          criticidad: data.criticidad || 'N',
          frecuencia: data.frecuencia || 'N',
          snapshotId: null
        }));

        await prisma.assessment.createMany({
          data: assessmentData
        });
      }

      // Return in expected format
      res.json({
        id: collaborator.id,
        nombre: collaborator.nombre,
        rol: collaborator.rol,
        esDemo: collaborator.esDemo,
        skills: skills || {}
      });
    } catch (error) {
      console.error('[API] POST /api/collaborators failed:', error);
      res.status(500).json({ message: 'Error saving collaborator' });
    }
  });

  // POST /api/reset-demo - Remove demo data
  app.post('/api/reset-demo', async (req, res) => {
    try {
      const demoCollaborators = await prisma.collaborator.findMany({
        where: { esDemo: true }
      });

      if (demoCollaborators.length === 0) {
        return res.status(409).json({ message: 'No hay datos demo para eliminar.' });
      }

      const demoIds = demoCollaborators.map(c => c.id);

      // Delete assessments first (foreign key constraint)
      await prisma.assessment.deleteMany({
        where: { collaboratorId: { in: demoIds } }
      });

      // Delete collaborators
      await prisma.collaborator.deleteMany({
        where: { id: { in: demoIds } }
      });

      res.json({
        collaborators: [],
        allowResetFromDemo: false
      });
    } catch (error) {
      console.error('[API] POST /api/reset-demo failed:', error);
      res.status(500).json({ message: 'Error resetting demo data' });
    }
  });

  // GET /api/categories - List all categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { skills: true } } }
      });
      res.json(categories.map(c => ({
        ...c,
        skillCount: c._count.skills
      })));
    } catch (error) {
      console.error('[API] GET /api/categories failed:', error);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  // GET /api/skills - List all skills
  app.get('/api/skills', async (req, res) => {
    try {
      const skills = await prisma.skill.findMany();
      res.json(skills);
    } catch (error) {
      console.error('[API] GET /api/skills failed:', error);
      res.status(500).json({ message: 'Error fetching skills' });
    }
  });

  // GET /api/collaborators - List all collaborators
  app.get('/api/collaborators', async (req, res) => {
    try {
      const collaborators = await prisma.collaborator.findMany();
      res.json(collaborators);
    } catch (error) {
      console.error('[API] GET /api/collaborators failed:', error);
      res.status(500).json({ message: 'Error fetching collaborators' });
    }
  });

  return app;
}

// ============================================================
// SERVER START (only when run directly)
// ============================================================
const PORT = process.env.PORT || 3001;

// Only start server if this file is run directly (not imported for tests)
if (process.argv[1] && process.argv[1].includes('index.js')) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[Server] Skills Matrix API running on http://localhost:${PORT}`);
  });
}
